import * as turf from '@turf/turf';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import nearestPointOnLine from '@turf/nearest-point-on-line';

// La Perle venue polygon (GeoJSON format)
// Coordinates: [longitude, latitude]
// Expanded by ~20 meters from original boundary
const LA_PERLE_POLYGON_COORDINATES = [
  [
    [55.25560224754644, 25.18412693757665], // top right (expanded)
    [55.25455113760126, 25.184630624209305], // top left (expanded)
    [55.25404705248281, 25.183586370163838], // bottom left (expanded)
    [55.255176925726794, 25.183339277480812], // bottom right (expanded)
    [55.25560224754644, 25.18412693757665], // Close the polygon
  ],
];

const ACCURACY_BUFFER_METERS = 5; // Additional buffer for GPS accuracy
const HYSTERESIS_TIMEOUT_MINUTES = 10; // Keep user "in" for 10 minutes
const HYSTERESIS_DISTANCE_METERS = 50; // Distance threshold to force "out"

interface GeofenceResult {
  isInside: boolean;
  distanceToEdge: number;
  message?: string;
}

interface GeofenceSession {
  artistId: string;
  isInside: number;
  lastCheckedAt: Date;
  lastLatitude: string | null;
  lastLongitude: string | null;
  lastAccuracy: string | null;
}

/**
 * Check if a point is inside the venue polygon
 */
function isPointInPolygon(latitude: number, longitude: number): boolean {
  const polygon = turf.polygon(LA_PERLE_POLYGON_COORDINATES);
  const point = turf.point([longitude, latitude]);
  return booleanPointInPolygon(point, polygon);
}

/**
 * Calculate distance from a point to the nearest edge of the polygon
 */
function getDistanceToPolygonEdge(latitude: number, longitude: number): number {
  const point = turf.point([longitude, latitude]);
  const polygon = turf.polygon(LA_PERLE_POLYGON_COORDINATES);
  
  // Get polygon boundary as a line
  const lineResult = turf.polygonToLine(polygon);
  
  // Handle both single feature and feature collection
  const line = 'features' in lineResult ? lineResult.features[0] : lineResult;
  
  // Find nearest point on the polygon boundary
  const nearest = nearestPointOnLine(line, point);
  
  // Calculate distance in meters
  const distance = turf.distance(point, nearest, { units: 'meters' });
  
  return distance;
}

/**
 * Main geofence validation function with accuracy and hysteresis
 * @param latitude User's latitude
 * @param longitude User's longitude  
 * @param accuracy GPS accuracy in meters
 * @param session Optional previous geofence session for hysteresis
 */
export function validateGeofence(
  latitude: number,
  longitude: number,
  accuracy: number,
  session?: GeofenceSession | null
): GeofenceResult {
  // In development mode, bypass geofencing for testing purposes
  if (process.env.NODE_ENV === 'development') {
    const isInPolygon = isPointInPolygon(latitude, longitude);
    const distanceToEdge = getDistanceToPolygonEdge(latitude, longitude);
    
    console.log(`[DEV MODE] Geofencing bypassed.`);
    console.log(`  - Point in polygon: ${isInPolygon}`);
    console.log(`  - Distance to edge: ${Math.round(distanceToEdge)}m`);
    console.log(`  - GPS accuracy: ${Math.round(accuracy)}m`);
    
    return {
      isInside: true,
      distanceToEdge: Math.round(distanceToEdge),
      message: 'Development mode - geofencing bypassed',
    };
  }

  const isInPolygon = isPointInPolygon(latitude, longitude);
  const distanceToEdge = getDistanceToPolygonEdge(latitude, longitude);

  // Apply hysteresis logic if we have a previous session
  if (session && session.isInside === 1) {
    const lastCheckedAt = new Date(session.lastCheckedAt);
    const now = new Date();
    const minutesSinceLastCheck = (now.getTime() - lastCheckedAt.getTime()) / (1000 * 60);

    // If less than 10 minutes since last check, apply hysteresis
    if (minutesSinceLastCheck < HYSTERESIS_TIMEOUT_MINUTES) {
      // Force "out" only if obviously outside by >50m
      if (!isInPolygon && distanceToEdge > HYSTERESIS_DISTANCE_METERS) {
        return {
          isInside: false,
          distanceToEdge: Math.round(distanceToEdge),
          message: `You are ${Math.round(distanceToEdge)}m outside the venue boundary.`,
        };
      }

      // Otherwise keep them "in" (hysteresis)
      return {
        isInside: true,
        distanceToEdge: Math.round(distanceToEdge),
        message: 'Inside venue (recent entry)',
      };
    }
  }

  // No hysteresis applies - check normally
  if (!isInPolygon) {
    return {
      isInside: false,
      distanceToEdge: Math.round(distanceToEdge),
      message: `You must be at La Perle to sign in. You are ${Math.round(distanceToEdge)}m from the venue.`,
    };
  }

  // Inside polygon - approved!
  return {
    isInside: true,
    distanceToEdge: Math.round(distanceToEdge),
    message: 'Successfully verified location',
  };
}

/**
 * Legacy function for backward compatibility
 */
export function isWithinVenue(latitude: number, longitude: number): boolean {
  const result = validateGeofence(latitude, longitude, 0);
  return result.isInside;
}

/**
 * Get distance from venue (for error messages)
 */
export function getDistanceFromVenue(latitude: number, longitude: number): number {
  return getDistanceToPolygonEdge(latitude, longitude);
}

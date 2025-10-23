const LA_PERLE_LATITUDE = 25.1872;
const LA_PERLE_LONGITUDE = 55.2674;
const ALLOWED_RADIUS_METERS = 100;

function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const earthRadiusMeters = 6371000;
  
  const dLat = degreesToRadians(lat2 - lat1);
  const dLon = degreesToRadians(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degreesToRadians(lat1)) * Math.cos(degreesToRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return earthRadiusMeters * c;
}

export function isWithinVenue(latitude: number, longitude: number): boolean {
  const distance = haversineDistance(
    latitude,
    longitude,
    LA_PERLE_LATITUDE,
    LA_PERLE_LONGITUDE
  );
  
  return distance <= ALLOWED_RADIUS_METERS;
}

export function getDistanceFromVenue(latitude: number, longitude: number): number {
  return haversineDistance(
    latitude,
    longitude,
    LA_PERLE_LATITUDE,
    LA_PERLE_LONGITUDE
  );
}

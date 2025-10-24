/**
 * GPS Reading result
 */
export interface GPSReading {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

/**
 * GPS Reading error
 */
export interface GPSError {
  code: number;
  message: string;
}

/**
 * Take a single GPS reading with high accuracy
 */
function getSingleReading(): Promise<GPSReading> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject({
        code: -1,
        message: 'Geolocation is not supported by your browser',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        reject({
          code: error.code,
          message: error.message,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000, // 10 seconds timeout per reading
        maximumAge: 0, // Don't use cached position
      }
    );
  });
}

/**
 * Take multiple GPS readings and return the best one (lowest accuracy value)
 * @param readingCount Number of readings to take (default: 3)
 * @param timeoutMs Total timeout in milliseconds (default: 10000)
 * @param onProgress Optional callback to report progress
 */
export async function getBestGPSReading(
  readingCount: number = 3,
  timeoutMs: number = 10000,
  onProgress?: (reading: GPSReading, readingNumber: number, total: number) => void
): Promise<GPSReading> {
  const readings: GPSReading[] = [];
  const errors: GPSError[] = [];
  const startTime = Date.now();

  for (let i = 0; i < readingCount; i++) {
    // Check if we've exceeded the total timeout
    if (Date.now() - startTime >= timeoutMs) {
      break;
    }

    try {
      const reading = await getSingleReading();
      readings.push(reading);
      
      if (onProgress) {
        onProgress(reading, i + 1, readingCount);
      }

      // If we got a very accurate reading (< 10m), we can stop early
      if (reading.accuracy < 10) {
        break;
      }
    } catch (error) {
      errors.push(error as GPSError);
      console.error(`GPS reading ${i + 1} failed:`, error);
    }
  }

  // If no readings succeeded, throw the last error
  if (readings.length === 0) {
    throw errors[errors.length - 1] || {
      code: -1,
      message: 'Failed to get GPS reading',
    };
  }

  // Return the reading with the lowest accuracy value (most accurate)
  return readings.reduce((best, current) => {
    return current.accuracy < best.accuracy ? current : best;
  });
}

/**
 * Check if GPS accuracy is acceptable
 */
export function isAccuracyAcceptable(accuracy: number, threshold: number = 50): boolean {
  return accuracy < threshold;
}

/**
 * Format accuracy for display
 */
export function formatAccuracy(accuracy: number): string {
  return `${Math.round(accuracy)}m`;
}

/**
 * Get user-friendly error message
 */
export function getGeolocationErrorMessage(error: GPSError): string {
  switch (error.code) {
    case 1: // PERMISSION_DENIED
      return 'Location access denied. Please enable location permissions in your browser settings.';
    case 2: // POSITION_UNAVAILABLE
      return 'Location information unavailable. Please check your device settings.';
    case 3: // TIMEOUT
      return 'Location request timed out. Please try again.';
    default:
      return error.message || 'Unable to get your location. Please try again.';
  }
}

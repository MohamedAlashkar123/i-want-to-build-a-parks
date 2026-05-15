import type { ParkRecord } from '../types/park';

type ValidationResult = {
  isValidForMap: boolean;
  isSuspicious: boolean;
  reason?: string;
};

const municipalityBounds = {
  ADM: { minLat: 23.5, maxLat: 25.0, minLng: 53.8, maxLng: 55.8 },
  AAM: { minLat: 23.8, maxLat: 24.6, minLng: 55.2, maxLng: 56.4 },
  DRM: { minLat: 22.5, maxLat: 24.8, minLng: 51.5, maxLng: 54.9 },
} as const;

function hasNumericLatLng(park: ParkRecord): park is ParkRecord & { latitude: number; longitude: number } {
  return (
    typeof park.latitude === 'number' &&
    typeof park.longitude === 'number' &&
    Number.isFinite(park.latitude) &&
    Number.isFinite(park.longitude)
  );
}

function isInsideBounds(
  latitude: number,
  longitude: number,
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number },
): boolean {
  return latitude >= bounds.minLat && latitude <= bounds.maxLat && longitude >= bounds.minLng && longitude <= bounds.maxLng;
}

export function validateParkLocation(park: ParkRecord): ValidationResult {
  if (!park.canPlotOnMap || !hasNumericLatLng(park)) {
    return {
      isValidForMap: false,
      isSuspicious: false,
      reason: 'Missing or invalid Latitude/Longitude.',
    };
  }

  if (!isInsideBounds(park.latitude, park.longitude, { minLat: 22, maxLat: 26, minLng: 51, maxLng: 57 })) {
    return {
      isValidForMap: false,
      isSuspicious: false,
      reason: 'Coordinate is outside the UAE validation range.',
    };
  }

  if (park.municipality in municipalityBounds) {
    const bounds = municipalityBounds[park.municipality as keyof typeof municipalityBounds];

    if (!isInsideBounds(park.latitude, park.longitude, bounds)) {
      return {
        isValidForMap: false,
        isSuspicious: true,
        reason: `Coordinate is outside the expected ${park.municipality} municipality area and needs GIS review.`,
      };
    }
  }

  return {
    isValidForMap: true,
    isSuspicious: false,
  };
}

export function getGisValidationStatus(park: ParkRecord): NonNullable<ParkRecord['gisValidationStatus']> {
  const validation = validateParkLocation(park);

  if (validation.isValidForMap) {
    return 'Valid';
  }

  return validation.isSuspicious ? 'Needs Review' : 'Invalid';
}

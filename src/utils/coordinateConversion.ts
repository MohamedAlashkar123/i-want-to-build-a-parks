import proj4 from 'proj4';
import type { ParkRecord } from '../types/park';

proj4.defs('EPSG:32640', '+proj=utm +zone=40 +datum=WGS84 +units=m +no_defs +type=crs');
proj4.defs('EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs +type=crs');

export type ParsedXYCoordinate = {
  x: number;
  y: number;
};

export type AdmXYConversionSample = {
  parkName: string;
  municipality: ParkRecord['municipality'];
  region?: string;
  x: number;
  y: number;
  convertedLatitude: number;
  convertedLongitude: number;
  googleMapsUrl: string;
  status: 'Pending CRS Confirmation';
};

function getText(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(getText).join(' ');
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).map(getText).join(' ');
  }

  return String(value);
}

function parseNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const text = getText(value).replace(/,/g, '').trim();
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function convertUtm40NToLatLng(x: number, y: number): { latitude: number; longitude: number } {
  const [longitude, latitude] = proj4('EPSG:32640', 'EPSG:4326', [x, y]);

  return {
    latitude,
    longitude,
  };
}

export function parseXYCoordinate(rawValue: unknown, yValue?: unknown): ParsedXYCoordinate | undefined {
  const separateX = parseNumber(rawValue);
  const separateY = parseNumber(yValue);

  if (separateX !== undefined && separateY !== undefined) {
    return {
      x: separateX,
      y: separateY,
    };
  }

  const text = getText(rawValue);
  const normalizedText = text
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[،;]/g, ',');
  const labeledX = normalizedText.match(/(?:\bX\b|x|إحداثي\s*x|احداثي\s*x)\s*[:=]?\s*(-?\d+(?:,\d{3})*(?:\.\d+)?|-?\d+(?:\.\d+)?)/i);
  const labeledY = normalizedText.match(/(?:\bY\b|y|إحداثي\s*y|احداثي\s*y)\s*[:=]?\s*(-?\d+(?:,\d{3})*(?:\.\d+)?|-?\d+(?:\.\d+)?)/i);

  if (labeledX && labeledY) {
    const x = parseNumber(labeledX[1]);
    const y = parseNumber(labeledY[1]);

    if (x !== undefined && y !== undefined) {
      return { x, y };
    }
  }

  const numbers = normalizedText.match(/-?\d+(?:,\d{3})*(?:\.\d+)?|-?\d+(?:\.\d+)?/g) ?? [];
  const parsedNumbers = numbers.map(parseNumber).filter((value): value is number => value !== undefined);

  if (parsedNumbers.length < 2) {
    return undefined;
  }

  const projectedPair = parsedNumbers.find((value, index) => {
    const nextValue = parsedNumbers[index + 1];
    return nextValue !== undefined && value > 100000 && nextValue > 1000000;
  });

  if (projectedPair !== undefined) {
    const index = parsedNumbers.indexOf(projectedPair);
    return {
      x: parsedNumbers[index],
      y: parsedNumbers[index + 1],
    };
  }

  return {
    x: parsedNumbers[0],
    y: parsedNumbers[1],
  };
}

export function parseProjectedXY(value: unknown, yValue?: unknown): ParsedXYCoordinate | undefined {
  return parseXYCoordinate(value, yValue);
}

export function getAdmXYConversionSamples(parks: ParkRecord[], limit = 10): AdmXYConversionSample[] {
  return parks
    .filter((park) => {
      const rawText = getText(park.coordinateRaw);

      return (
        park.municipality === 'ADM' &&
        (park.coordinateSource === 'Projected XY' ||
          park.coordinateConversionStatus === 'Pending CRS Confirmation' ||
          /\b[XY]\b|إحداثيات|احداثيات/i.test(rawText))
      );
    })
    .flatMap((park): AdmXYConversionSample[] => {
      const parsed = parseXYCoordinate(park.coordinateRaw);

      if (!parsed) {
        return [];
      }

      const converted = convertUtm40NToLatLng(parsed.x, parsed.y);

      return [{
        parkName: park.parkName,
        municipality: park.municipality,
        region: park.region,
        x: parsed.x,
        y: parsed.y,
        convertedLatitude: converted.latitude,
        convertedLongitude: converted.longitude,
        googleMapsUrl: `https://www.google.com/maps?q=${converted.latitude},${converted.longitude}`,
        status: 'Pending CRS Confirmation' as const,
      }];
    })
    .slice(0, limit);
}

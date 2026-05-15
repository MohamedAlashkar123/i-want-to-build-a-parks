import ExcelJS from 'exceljs';
import { excelFileName } from './loadExcel';
import { enrichWithConfirmedSmartPark } from './confirmedSmartParks';
import type { ParkRecord } from '../types/park';
import { convertUtm40NToLatLng, parseProjectedXY } from '../utils/coordinateConversion';
import { getGisValidationStatus, validateParkLocation } from '../utils/gisValidation';

type Municipality = ParkRecord['municipality'];
type YesNoUnknown = 'Yes' | 'No' | 'Unknown';
type CoordinateSource = NonNullable<ParkRecord['coordinateSource']>;
type CoordinateConversionStatus = NonNullable<ParkRecord['coordinateConversionStatus']>;
type ExtractedXY = {
  x: number | null;
  y: number | null;
  raw: string;
  rawX?: string;
  rawY?: string;
  source?: 'Header' | 'Adjacent Scan';
};

const mainSheetNames = ['NEW - ADM Parks', 'NEW - DRM Parks', 'New AAM Parks V2'];
const excelFileUrl = `/${excelFileName}`;
const projectedCoordinateIssue = 'Projected X/Y coordinates require conversion';

const xyConversionBounds = {
  ADM: { minLat: 23.5, maxLat: 25, minLng: 53.8, maxLng: 55.8 },
  AAM: { minLat: 23.8, maxLat: 24.6, minLng: 55.2, maxLng: 56.4 },
  DRM: { minLat: 22.5, maxLat: 24.8, minLng: 51.5, maxLng: 54.9 },
} as const;

function isWithinMunicipalityVisualizationBounds(municipality: Municipality, latitude: number, longitude: number): boolean {
  if (!(municipality in xyConversionBounds)) {
    return false;
  }

  const bounds = xyConversionBounds[municipality as keyof typeof xyConversionBounds];
  return latitude >= bounds.minLat && latitude <= bounds.maxLat && longitude >= bounds.minLng && longitude <= bounds.maxLng;
}

function convertedCoordinateSourceForMunicipality(municipality: Municipality): CoordinateSource {
  if (municipality === 'ADM') {
    return 'Converted ADM X/Y';
  }

  if (municipality === 'AAM') {
    return 'Converted AAM X/Y';
  }

  if (municipality === 'DRM') {
    return 'Converted DRM X/Y';
  }

  return 'Converted X/Y';
}

function isLikelyProjectedXY(x: number | null, y: number | null): boolean {
  return x !== null && y !== null && x >= 100000 && x <= 800000 && y >= 2000000 && y <= 3500000;
}

function normalizeText(value: unknown): string {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeHeaderLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[إأآا]/g, 'ا')
    .replace(/[^\p{L}\p{N},]+/gu, '')
    .replace(/\s+/g, '')
    .trim();
}

function isCoordinateHeaderLabel(label: string): boolean {
  const normalized = normalizeHeaderLabel(label);

  return (
    normalized.includes('احداثيات') ||
    normalized.includes('coordinates') ||
    normalized.includes('coordinate') ||
    normalized.includes('xy') ||
    normalized.includes('x,y')
  );
}

export function getCellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return normalizeText(value);
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === 'object' && 'hyperlink' in value) {
    const hyperlink = typeof value.hyperlink === 'string' ? value.hyperlink : '';
    const text = 'text' in value && typeof value.text === 'string' ? value.text : '';
    return normalizeText([hyperlink, text].filter(Boolean).join(' '));
  }

  if (typeof value === 'object' && 'richText' in value && Array.isArray(value.richText)) {
    return normalizeText(value.richText.map((part) => part.text).join(' '));
  }

  if (typeof value === 'object' && 'text' in value && typeof value.text === 'string') {
    return normalizeText(value.text);
  }

  if (typeof value === 'object' && 'result' in value) {
    return getCellText(value.result as ExcelJS.CellValue);
  }

  if (typeof value === 'object' && 'formula' in value) {
    const formula = typeof value.formula === 'string' ? value.formula : '';
    return normalizeText(formula);
  }

  return normalizeText(value);
}

export function normalizeYesNo(value: unknown): YesNoUnknown {
  const normalized = normalizeText(value).toLowerCase();

  if (!normalized) {
    return 'Unknown';
  }

  if (['نعم', 'yes', 'y', 'true'].includes(normalized)) {
    return 'Yes';
  }

  if (['لا', 'لا يوجد', 'no', 'n', 'false', 'none'].includes(normalized)) {
    return 'No';
  }

  return 'Unknown';
}

export function parseCameraCount(value: unknown): number {
  const normalized = normalizeText(value);

  if (!normalized || normalized === 'لا يوجد') {
    return 0;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, value);
  }

  const parsed = Number(normalized.replace(/,/g, ''));
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function parseCoordinateNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const normalized = normalizeText(value)
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/,/g, '')
    .trim();

  if (!normalized || normalized === '-' || /غير\s*مخصص|غير\s*مخصصة/.test(normalized)) {
    return null;
  }

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : null;
}

function isInvalidCameraCountValue(value: unknown): boolean {
  const normalized = normalizeText(value);

  if (!normalized || normalized === 'لا يوجد') {
    return false;
  }

  if (typeof value === 'number') {
    return !Number.isFinite(value) || value < 0;
  }

  const parsed = Number(normalized.replace(/,/g, ''));
  return !Number.isFinite(parsed) || parsed < 0;
}

export function detectMunicipality(sheetName: string): Municipality {
  const normalized = sheetName.trim().toLowerCase();

  if (normalized === 'new - adm parks') {
    return 'ADM';
  }

  if (normalized === 'new - drm parks') {
    return 'DRM';
  }

  if (normalized === 'new aam parks v2') {
    return 'AAM';
  }

  return 'Unknown';
}

export function isValidLatLng(latitude: number | null | undefined, longitude: number | null | undefined): boolean {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function isValidUaeLatLng(latitude: number | null | undefined, longitude: number | null | undefined): boolean {
  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    !isValidLatLng(latitude, longitude)
  ) {
    return false;
  }

  return latitude >= 22 && latitude <= 26 && longitude >= 51 && longitude <= 57;
}

export function normalizeCoordinateValue(value: unknown): string {
  return normalizeText(value)
    .replace(/[؛،]/g, ',')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeCoordinateValue(value: unknown): string {
  const normalized = normalizeCoordinateValue(value);

  try {
    return decodeURIComponent(normalized);
  } catch {
    return normalized;
  }
}

function parsePair(latitudeValue: string, longitudeValue: string): { latitude: number | null; longitude: number | null } {
  const latitude = Number(latitudeValue);
  const longitude = Number(longitudeValue);

  return isValidUaeLatLng(latitude, longitude) ? { latitude, longitude } : { latitude: null, longitude: null };
}

export function detectProjectedXY(value: unknown): boolean {
  const normalized = decodeCoordinateValue(value);
  const matches = [...normalized.matchAll(/-?\d+(?:\.\d+)?/g)].map((match) => Number(match[0]));

  for (let index = 0; index < matches.length - 1; index += 1) {
    const first = Math.abs(matches[index]);
    const second = Math.abs(matches[index + 1]);

    if (first >= 100000 && second >= 100000) {
      return true;
    }
  }

  return false;
}

function hasGoogleMapsPattern(value: string): boolean {
  return /google\.[^/\s]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps|maps\/place|!3d|@-?\d|[?&](q|query|ll|destination)=-?\d/i.test(
    value,
  );
}

function hasTextCoordinatePattern(value: string): boolean {
  return (
    /(?:lat(?:itude)?|خط\s*العرض)\s*[:=]?\s*-?\d+(?:\.\d+)?\D{0,40}(?:lng|lon|long(?:itude)?|خط\s*الطول)\s*[:=]?\s*-?\d+(?:\.\d+)?/i.test(
      value,
    ) ||
    /(^|[^\d.-])-?\d{1,2}(?:\.\d+)?\s*,\s*-?\d{1,3}(?:\.\d+)?(?=$|[^\d.])/.test(value) ||
    /(^|[^\d.-])-?\d{1,2}(?:\.\d+)?\s+-?\d{1,3}(?:\.\d+)?(?=$|[^\d.])/.test(value)
  );
}

export function detectCoordinateSource(value: unknown): CoordinateSource {
  const decoded = decodeCoordinateValue(value);

  if (!decoded) {
    return 'Missing';
  }

  if (detectProjectedXY(decoded)) {
    return 'Projected XY';
  }

  if (hasGoogleMapsPattern(decoded)) {
    return 'Google Maps';
  }

  if (hasTextCoordinatePattern(decoded)) {
    return 'LatLng Text';
  }

  return 'Unknown';
}

export const detectCoordinateType = detectCoordinateSource;

export function extractLatLngFromGoogleMaps(value: unknown): { latitude: number | null; longitude: number | null } {
  const rawValue = normalizeCoordinateValue(value);

  if (!rawValue) {
    return { latitude: null, longitude: null };
  }

  const decoded = decodeCoordinateValue(rawValue);

  if (!hasGoogleMapsPattern(decoded) || detectProjectedXY(decoded)) {
    return { latitude: null, longitude: null };
  }

  const dmsMatch = decoded.match(/(\d+(?:\.\d+)?)°(\d+(?:\.\d+)?)'(\d+(?:\.\d+)?)"([NS])\s*\+?(\d+(?:\.\d+)?)°(\d+(?:\.\d+)?)'(\d+(?:\.\d+)?)"([EW])/i);

  if (dmsMatch) {
    const latitude = dmsToDecimal(dmsMatch[1], dmsMatch[2], dmsMatch[3], dmsMatch[4]);
    const longitude = dmsToDecimal(dmsMatch[5], dmsMatch[6], dmsMatch[7], dmsMatch[8]);
    return isValidUaeLatLng(latitude, longitude) ? { latitude, longitude } : { latitude: null, longitude: null };
  }

  const googleMarkerMatch = decoded.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (googleMarkerMatch) {
    return parsePair(googleMarkerMatch[1], googleMarkerMatch[2]);
  }

  const coordinatePairMatch = decoded.match(/(?:@|[?&](?:q|query|ll|destination)=|\/)(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/i);
  if (coordinatePairMatch) {
    return parsePair(coordinatePairMatch[1], coordinatePairMatch[2]);
  }

  return { latitude: null, longitude: null };
}

export function extractLatLngFromText(value: unknown): { latitude: number | null; longitude: number | null } {
  const decoded = decodeCoordinateValue(value);

  if (!decoded || detectProjectedXY(decoded)) {
    return { latitude: null, longitude: null };
  }

  const labeledMatch = decoded.match(
    /(?:lat(?:itude)?|خط\s*العرض)\s*[:=]?\s*(-?\d+(?:\.\d+)?)\D{0,40}(?:lng|lon|long(?:itude)?|خط\s*الطول)\s*[:=]?\s*(-?\d+(?:\.\d+)?)/i,
  );

  if (labeledMatch) {
    return parsePair(labeledMatch[1], labeledMatch[2]);
  }

  const coordinatePairMatch = decoded.match(/(^|[^\d.-])(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)(?=$|[^\d.])/);

  if (coordinatePairMatch) {
    return parsePair(coordinatePairMatch[2], coordinatePairMatch[3]);
  }

  const spacedPairMatch = decoded.match(/(^|[^\d.-])(-?\d{1,2}(?:\.\d+)?)\s+(-?\d{1,3}(?:\.\d+)?)(?=$|[^\d.])/);

  if (spacedPairMatch) {
    return parsePair(spacedPairMatch[2], spacedPairMatch[3]);
  }

  return { latitude: null, longitude: null };
}

function dmsToDecimal(degrees: string, minutes: string, seconds: string, direction: string): number {
  const sign = ['S', 'W'].includes(direction.toUpperCase()) ? -1 : 1;
  return sign * (Number(degrees) + Number(minutes) / 60 + Number(seconds) / 3600);
}

type HeaderCell = {
  columnNumber: number;
  label: string;
};

function getHeaderCells(worksheet: ExcelJS.Worksheet): HeaderCell[] {
  const headers: HeaderCell[] = [];
  const columnLabels = new Map<number, string[]>();

  [1, 2].forEach((rowNumber) => {
    const headerRow = worksheet.getRow(rowNumber);

    headerRow.eachCell({ includeEmpty: false }, (cell, columnNumber) => {
      const label = getCellText(cell.value);

      if (!label) {
        return;
      }

      columnLabels.set(columnNumber, [...(columnLabels.get(columnNumber) ?? []), label]);
    });
  });

  [...columnLabels.entries()].forEach(([columnNumber, labels]) => {
    headers.push({
      columnNumber,
      label: labels.join(' '),
    });
  });

  return headers;
}

function findColumn(headers: HeaderCell[], matcher: (label: string) => boolean): number | undefined {
  return headers.find((header) => matcher(header.label))?.columnNumber;
}

function findColumns(headers: HeaderCell[], matcher: (label: string) => boolean): number[] {
  return headers.filter((header) => matcher(header.label)).map((header) => header.columnNumber);
}

function readCell(row: ExcelJS.Row, columnNumber: number | undefined): string {
  if (!columnNumber) {
    return '';
  }

  return getCellText(row.getCell(columnNumber).value);
}

function compactOptional(value: string): string | undefined {
  const normalized = normalizeText(value);
  return normalized && normalized !== 'لا يوجد' ? normalized : undefined;
}

function extractXYFromRow(row: ExcelJS.Row, xColumnIndex: number, source: ExtractedXY['source'] = 'Header'): ExtractedXY {
  const xRaw = readCell(row, xColumnIndex);
  const yRaw = readCell(row, xColumnIndex + 1);
  const combined = parseProjectedXY(xRaw);

  if (combined && isLikelyProjectedXY(combined.x, combined.y)) {
    return {
      x: combined.x,
      y: combined.y,
      raw: `${combined.x}, ${combined.y}`,
      rawX: xRaw,
      rawY: yRaw,
      source,
    };
  }

  const x = parseCoordinateNumber(xRaw);
  const y = parseCoordinateNumber(yRaw);

  if (isLikelyProjectedXY(x, y)) {
    return {
      x,
      y,
      raw: `${x}, ${y}`,
      rawX: xRaw,
      rawY: yRaw,
      source,
    };
  }

  return {
    x: null,
    y: null,
    raw: '',
    rawX: xRaw,
    rawY: yRaw,
    source,
  };
}

function extractXYFromAdjacentCellsByRange(
  row: ExcelJS.Row,
  xRange: { min: number; max: number },
  yRange: { min: number; max: number },
): ExtractedXY {
  const lastCell = Math.max(row.cellCount, row.actualCellCount);

  for (let column = 1; column < lastCell; column += 1) {
    const xRaw = readCell(row, column);
    const yRaw = readCell(row, column + 1);
    const x = parseCoordinateNumber(xRaw);
    const y = parseCoordinateNumber(yRaw);

    if (x !== null && y !== null && x >= xRange.min && x <= xRange.max && y >= yRange.min && y <= yRange.max) {
      return {
        x,
        y,
        raw: `${x}, ${y}`,
        rawX: xRaw,
        rawY: yRaw,
        source: 'Adjacent Scan',
      };
    }
  }

  return {
    x: null,
    y: null,
    raw: '',
  };
}

function extractXYFromCoordinateColumns(row: ExcelJS.Row, coordinateColumns: number[], municipality: Municipality): ExtractedXY {
  for (const column of coordinateColumns) {
    const xy = extractXYFromRow(row, column);

    if (xy.x !== null && xy.y !== null) {
      return xy;
    }
  }

  if (municipality === 'AAM') {
    const aamFallback = extractXYFromAdjacentCellsByRange(row, { min: 300000, max: 450000 }, { min: 2600000, max: 2800000 });

    if (aamFallback.x !== null && aamFallback.y !== null) {
      return aamFallback;
    }
  }

  return {
    x: null,
    y: null,
    raw: '',
  };
}

function convertXYForMap(municipality: Municipality, x: number, y: number): {
  latitude: number | null;
  longitude: number | null;
  convertedLatitude: number;
  convertedLongitude: number;
  coordinateConversionStatus: CoordinateConversionStatus;
  canPlotOnMap: boolean;
  reason?: string;
} {
  const converted = convertUtm40NToLatLng(x, y);

  if (!isWithinMunicipalityVisualizationBounds(municipality, converted.latitude, converted.longitude)) {
    return {
      latitude: null,
      longitude: null,
      convertedLatitude: converted.latitude,
      convertedLongitude: converted.longitude,
      coordinateConversionStatus: 'Conversion Review Required',
      canPlotOnMap: false,
      reason: `Converted coordinate is outside the expected ${municipality} validation range.`,
    };
  }

  return {
    latitude: converted.latitude,
    longitude: converted.longitude,
    convertedLatitude: converted.latitude,
    convertedLongitude: converted.longitude,
    coordinateConversionStatus: 'Converted for Map Visualization',
    canPlotOnMap: true,
  };
}

function parseCoordinate(row: ExcelJS.Row, coordinateColumns: number[], municipality: Municipality): {
  coordinateRaw?: string;
  coordinateSource: CoordinateSource;
  coordinateConversionStatus: CoordinateConversionStatus;
  canPlotOnMap: boolean;
  latitude: number | null;
  longitude: number | null;
  xyRawX?: string;
  xyRawY?: string;
  xyParsedX?: number | null;
  xyParsedY?: number | null;
  xyConvertedLatitude?: number | null;
  xyConvertedLongitude?: number | null;
  xyConversionReason?: string;
} {
  const coordinateValues = coordinateColumns.map((column) => normalizeCoordinateValue(readCell(row, column))).filter(Boolean);
  const coordinateRaw = coordinateValues.join(' | ') || undefined;

  if (['ADM', 'AAM', 'DRM'].includes(municipality)) {
    const xy = extractXYFromCoordinateColumns(row, coordinateColumns, municipality);

    if (xy.x !== null && xy.y !== null) {
      const converted = convertXYForMap(municipality, xy.x, xy.y);

      return {
        coordinateRaw: xy.raw,
        coordinateSource: converted.canPlotOnMap ? convertedCoordinateSourceForMunicipality(municipality) : 'Projected XY',
        coordinateConversionStatus: converted.coordinateConversionStatus,
        canPlotOnMap: converted.canPlotOnMap,
        latitude: converted.latitude,
        longitude: converted.longitude,
        xyRawX: xy.rawX,
        xyRawY: xy.rawY,
        xyParsedX: xy.x,
        xyParsedY: xy.y,
        xyConvertedLatitude: converted.convertedLatitude,
        xyConvertedLongitude: converted.convertedLongitude,
        xyConversionReason: converted.reason,
      };
    }
  }

  if (!coordinateRaw) {
    return {
      coordinateSource: 'Missing',
      coordinateConversionStatus: 'Missing',
      canPlotOnMap: false,
      latitude: null,
      longitude: null,
    };
  }

  if (
    detectCoordinateSource(coordinateRaw) === 'Projected XY' ||
    coordinateValues.some((coordinateValue) => detectCoordinateSource(coordinateValue) === 'Projected XY')
  ) {
    return {
      coordinateRaw,
      coordinateSource: 'Projected XY',
      coordinateConversionStatus: 'Pending CRS Confirmation',
      canPlotOnMap: false,
      latitude: null,
      longitude: null,
    };
  }

  const hasGoogleMapsCoordinates = coordinateValues.some(
    (coordinateValue) => detectCoordinateSource(coordinateValue) === 'Google Maps',
  );

  for (const coordinateValue of coordinateValues) {
    const parsed = extractLatLngFromGoogleMaps(coordinateValue);

    if (isValidUaeLatLng(parsed.latitude, parsed.longitude)) {
      return {
        coordinateRaw,
        coordinateSource: 'Google Maps',
        coordinateConversionStatus: 'Ready for Map',
        canPlotOnMap: true,
        latitude: parsed.latitude,
        longitude: parsed.longitude,
      };
    }
  }

  if (hasGoogleMapsCoordinates) {
    return {
      coordinateRaw,
      coordinateSource: 'Google Maps',
      coordinateConversionStatus: 'Invalid',
      canPlotOnMap: false,
      latitude: null,
      longitude: null,
    };
  }

  const hasTextCoordinates = coordinateValues.some(
    (coordinateValue) => detectCoordinateSource(coordinateValue) === 'LatLng Text',
  );

  for (const coordinateValue of coordinateValues) {
    const parsed = extractLatLngFromText(coordinateValue);

    if (isValidUaeLatLng(parsed.latitude, parsed.longitude)) {
      return {
        coordinateRaw,
        coordinateSource: 'LatLng Text',
        coordinateConversionStatus: 'Ready for Map',
        canPlotOnMap: true,
        latitude: parsed.latitude,
        longitude: parsed.longitude,
      };
    }
  }

  if (hasTextCoordinates) {
    return {
      coordinateRaw,
      coordinateSource: 'LatLng Text',
      coordinateConversionStatus: 'Invalid',
      canPlotOnMap: false,
      latitude: null,
      longitude: null,
    };
  }

  return {
    coordinateRaw,
    coordinateSource: 'Unknown',
    coordinateConversionStatus: 'Invalid',
    canPlotOnMap: false,
    latitude: null,
    longitude: null,
  };
}

function applyTemporaryXYConversion(park: ParkRecord): ParkRecord {
  if (
    !['ADM', 'AAM', 'DRM'].includes(park.municipality) ||
    park.canPlotOnMap ||
    !park.coordinateRaw ||
    park.coordinateSource !== 'Projected XY'
  ) {
    return park;
  }

  const parsed = parseProjectedXY(park.coordinateRaw);

  if (!parsed) {
    return park;
  }

  const converted = convertUtm40NToLatLng(parsed.x, parsed.y);

  if (!isWithinMunicipalityVisualizationBounds(park.municipality, converted.latitude, converted.longitude)) {
    return {
      ...park,
      canPlotOnMap: false,
      coordinateConversionStatus: 'Conversion Review Required',
      xyParsedX: parsed.x,
      xyParsedY: parsed.y,
      xyConvertedLatitude: converted.latitude,
      xyConvertedLongitude: converted.longitude,
      xyConversionReason: `${park.municipality} conversion is outside validation range.`,
      dataQualityIssues: [
        ...park.dataQualityIssues.filter((issue) => issue !== projectedCoordinateIssue),
        `${park.municipality} X/Y conversion review required`,
      ],
    };
  }

  return {
    ...park,
    latitude: converted.latitude,
    longitude: converted.longitude,
    canPlotOnMap: true,
    coordinateSource: convertedCoordinateSourceForMunicipality(park.municipality),
    coordinateConversionStatus: 'Converted for Map Visualization',
    xyParsedX: parsed.x,
    xyParsedY: parsed.y,
    xyConvertedLatitude: converted.latitude,
    xyConvertedLongitude: converted.longitude,
    dataQualityIssues: park.dataQualityIssues.filter(
      (issue) => issue !== projectedCoordinateIssue && issue !== 'Missing or invalid GIS coordinates',
    ),
  };
}

function isConvertedXYSource(park: ParkRecord, municipality: 'ADM' | 'AAM' | 'DRM'): boolean {
  return park.coordinateSource === convertedCoordinateSourceForMunicipality(municipality);
}

function logXYConversionDebug(parks: ParkRecord[]) {
  const summary = (['ADM', 'AAM', 'DRM'] as const).reduce(
    (accumulator, municipality) => {
      const records = parks.filter((park) => park.municipality === municipality);
      const xyDetected = records.filter(
        (park) =>
          isConvertedXYSource(park, municipality) ||
          park.coordinateSource === 'Projected XY' ||
          Boolean(parseProjectedXY(park.coordinateRaw)),
      );
      const converted = records.filter((park) => isConvertedXYSource(park, municipality) && park.canPlotOnMap);

      return {
        ...accumulator,
        [`total${municipality}Records`]: records.length,
        [`${municipality}XYDetected`]: xyDetected.length,
        [`${municipality}ConvertedSuccessfully`]: converted.length,
      };
    },
    {} as Record<string, number>,
  );
  const geoJsonFeaturesByMunicipality = (['ADM', 'AAM', 'DRM'] as const).reduce(
    (accumulator, municipality) => ({
      ...accumulator,
      [municipality]: parks.filter((park) => park.municipality === municipality && park.canPlotOnMap).length,
    }),
    {} as Record<'ADM' | 'AAM' | 'DRM', number>,
  );
  const first5AamConvertedSamples = parks
    .filter((park) => isConvertedXYSource(park, 'AAM') && park.canPlotOnMap)
    .slice(0, 5)
    .map((park) => {
    const xy = parseProjectedXY(park.coordinateRaw);

    return {
      parkName: park.parkName,
      x: xy?.x ?? null,
      y: xy?.y ?? null,
      latitude: park.latitude,
      longitude: park.longitude,
      coordinateSource: park.coordinateSource,
      canPlotOnMap: park.canPlotOnMap,
    };
  });

  console.log('X/Y conversion summary', {
    ...summary,
    geoJsonFeaturesByMunicipality,
    first5AamConvertedSamples,
  });
}

export function normalizeWorkbookToParks(workbook: ExcelJS.Workbook): ParkRecord[] {
  const parks: ParkRecord[] = [];

  workbook.worksheets
    .filter((worksheet) => mainSheetNames.includes(worksheet.name.trim()))
    .forEach((worksheet) => {
      const municipality = detectMunicipality(worksheet.name);
      const headers = getHeaderCells(worksheet);
      const columns = {
        parkName: findColumn(headers, (label) => label.includes('اسم الحديقة')),
        parkReferenceNumber: findColumn(headers, (label) => label.includes('الرقم الموحد للحديقة')),
        region: findColumn(headers, (label) => label.includes('المنطقة') || label.toLowerCase().includes('region')),
        parkType: findColumn(headers, (label) => label.includes('نوع الحديقة')),
        parkClassification: findColumn(headers, (label) => label.includes('التصنيف')),
        supervisorEntity: findColumn(headers, (label) => label.includes('تحت إشراف')),
        locationText: findColumn(headers, (label) => label.includes('موقع') || label.includes('عنوان')),
        coordinates: findColumns(headers, isCoordinateHeaderLabel),
        hasCctvSystem: findColumn(headers, (label) => label.includes('يوجد نظام مراقبة')),
        totalCameras: findColumn(headers, (label) => label.includes('عدد الكاميرات')),
        hasMaintenanceContract: findColumn(headers, (label) => label.includes('يوجد عقد صيانة')),
        maintenanceCompany: findColumn(headers, (label) => label.includes('اسم شركة الصيانة')),
        maintenanceContractEndDate: findColumn(headers, (label) => label.includes('تاريخ انتهاء عقد الصيانة')),
        hasDrawings: findColumn(headers, (label) => label.includes('توجد مخططات')),
      };

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber <= 2) {
          return;
        }

        const parkName = compactOptional(readCell(row, columns.parkName));

        if (!parkName) {
          return;
        }

        const dataQualityIssues: string[] = [];
        const cameraCountValue = readCell(row, columns.totalCameras);
        const totalCameras = parseCameraCount(cameraCountValue);

        if (isInvalidCameraCountValue(cameraCountValue)) {
          dataQualityIssues.push('Invalid camera count');
        }

        const coordinates = parseCoordinate(row, columns.coordinates, municipality);

        if (!coordinates.canPlotOnMap) {
          dataQualityIssues.push(
            coordinates.coordinateSource === 'Projected XY'
              ? projectedCoordinateIssue
              : 'Missing or invalid GIS coordinates',
          );
        }

        parks.push({
          id: `${municipality}-${worksheet.name.trim()}-${rowNumber}`,
          sourceSheet: worksheet.name.trim(),
          sourceRowNumber: rowNumber,
          municipality,
          parkName,
          parkReferenceNumber: compactOptional(readCell(row, columns.parkReferenceNumber)),
          region: compactOptional(readCell(row, columns.region)),
          parkType: compactOptional(readCell(row, columns.parkType)),
          parkClassification: compactOptional(readCell(row, columns.parkClassification)),
          supervisorEntity: compactOptional(readCell(row, columns.supervisorEntity)),
          locationText: compactOptional(readCell(row, columns.locationText)) || compactOptional(readCell(row, columns.region)),
          coordinateRaw: coordinates.coordinateRaw,
          coordinateSource: coordinates.coordinateSource,
          coordinateConversionStatus: coordinates.coordinateConversionStatus,
          canPlotOnMap: coordinates.canPlotOnMap,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          xyRawX: coordinates.xyRawX,
          xyRawY: coordinates.xyRawY,
          xyParsedX: coordinates.xyParsedX,
          xyParsedY: coordinates.xyParsedY,
          xyConvertedLatitude: coordinates.xyConvertedLatitude,
          xyConvertedLongitude: coordinates.xyConvertedLongitude,
          xyConversionReason: coordinates.xyConversionReason,
          hasCctvSystem: normalizeYesNo(readCell(row, columns.hasCctvSystem)),
          totalCameras,
          hasMaintenanceContract: normalizeYesNo(readCell(row, columns.hasMaintenanceContract)),
          maintenanceCompany: compactOptional(readCell(row, columns.maintenanceCompany)),
          maintenanceContractEndDate: compactOptional(readCell(row, columns.maintenanceContractEndDate)),
          hasDrawings: normalizeYesNo(readCell(row, columns.hasDrawings)),
          cameraSetupType: 'Standalone',
          dmtIntegrationStatus: 'Not Integrated',
          dataQualityIssues,
        });
      });
    });

  const normalizedParks = parks.map((park) => {
    const convertedPark = applyTemporaryXYConversion(park);
    const smartPark = enrichWithConfirmedSmartPark(convertedPark);
    const validation = validateParkLocation(smartPark);

    return {
      ...smartPark,
      gisValidationStatus: getGisValidationStatus(smartPark),
      gisValidationReason: validation.reason,
    };
  });

  logXYConversionDebug(normalizedParks);

  return normalizedParks;
}

export async function loadNormalizedParks(): Promise<ParkRecord[]> {
  const response = await fetch(excelFileUrl);

  if (!response.ok) {
    throw new Error('تعذر تحميل ملف البيانات. يرجى التأكد من وجود الملف داخل مجلد public.');
  }

  const arrayBuffer = await response.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  return normalizeWorkbookToParks(workbook);
}

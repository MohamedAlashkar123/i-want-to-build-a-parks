import ExcelJS from 'exceljs';
import { excelFileName } from './loadExcel';
import { enrichWithConfirmedSmartPark } from './confirmedSmartParks';
import type { ParkRecord } from '../types/park';
import { getGisValidationStatus, validateParkLocation } from '../utils/gisValidation';

type Municipality = ParkRecord['municipality'];
type YesNoUnknown = 'Yes' | 'No' | 'Unknown';
type CoordinateSource = NonNullable<ParkRecord['coordinateSource']>;
type CoordinateConversionStatus = NonNullable<ParkRecord['coordinateConversionStatus']>;

const mainSheetNames = ['NEW - ADM Parks', 'NEW - DRM Parks', 'New AAM Parks V2'];
const excelFileUrl = `/${excelFileName}`;
const projectedCoordinateIssue = 'Projected X/Y coordinates require conversion';

function normalizeText(value: unknown): string {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
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
  const headerRow = worksheet.getRow(2);
  const headers: HeaderCell[] = [];

  headerRow.eachCell({ includeEmpty: false }, (cell, columnNumber) => {
    headers.push({
      columnNumber,
      label: getCellText(cell.value),
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

function parseCoordinate(row: ExcelJS.Row, coordinateColumns: number[]): {
  coordinateRaw?: string;
  coordinateSource: CoordinateSource;
  coordinateConversionStatus: CoordinateConversionStatus;
  canPlotOnMap: boolean;
  latitude: number | null;
  longitude: number | null;
} {
  const coordinateValues = coordinateColumns.map((column) => normalizeCoordinateValue(readCell(row, column))).filter(Boolean);
  const coordinateRaw = coordinateValues.join(' | ') || undefined;

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
        region: findColumn(headers, (label) => label === 'المنطقة'),
        parkType: findColumn(headers, (label) => label.includes('نوع الحديقة')),
        parkClassification: findColumn(headers, (label) => label.includes('التصنيف')),
        supervisorEntity: findColumn(headers, (label) => label.includes('تحت إشراف')),
        locationText: findColumn(headers, (label) => label.includes('موقع') || label.includes('عنوان')),
        coordinates: findColumns(headers, (label) => label.includes('إحداثيات')),
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

        const coordinates = parseCoordinate(row, columns.coordinates);

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

  return parks.map((park) => {
    const smartPark = enrichWithConfirmedSmartPark(park);
    const validation = validateParkLocation(smartPark);

    return {
      ...smartPark,
      gisValidationStatus: getGisValidationStatus(smartPark),
      gisValidationReason: validation.reason,
    };
  });
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

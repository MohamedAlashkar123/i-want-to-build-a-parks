import type { ParkRecord } from '../types/park';

export type ConfirmedSmartPark = {
  municipality: 'ADM' | 'AAM' | 'DRM';
  smartParkNameEn: string;
  smartParkNameAr?: string;
  aliases: string[];
  capabilities: string[];
  isSmartPark: true;
  dmtIntegrationStatus: 'Integrated';
  dmtIntegrationConfirmed: true;
  dmtIntegrationScope: 'Smart Parks Platform / DMT systems';
  smartSystemAvailable: true;
  hasSensors: true;
  hasCameras: true;
  xCoordinate?: number | string;
  yCoordinate?: number | string;
  latitude?: number;
  longitude?: number;
  coordinateStatus?: 'Provided' | 'Pending' | 'Matched from Excel' | 'Needs CRS Conversion';
  aiVisitorCountingAvailable: boolean;
  aiVisitorCountingCameraCount: number;
  aiVisitorCountingMethod?: 'CCTV Cam';
  smartParkNote?: string;
};

const smartParkCapabilities = ['Sensors', 'Smart sensor management system'];
const dmtIntegrationScope = 'Smart Parks Platform / DMT systems';

export const confirmedSmartParks: ConfirmedSmartPark[] = [
  {
    municipality: 'ADM',
    smartParkNameEn: 'Delma Park',
    smartParkNameAr: 'حديقة دالما',
    aliases: ['Delma Park', 'Dalma Park', 'حديقة دالما', 'حديقة دلما'],
    capabilities: smartParkCapabilities,
    isSmartPark: true,
    dmtIntegrationStatus: 'Integrated',
    dmtIntegrationConfirmed: true,
    dmtIntegrationScope,
    smartSystemAvailable: true,
    hasSensors: true,
    hasCameras: true,
    latitude: 24.413,
    longitude: 54.3897,
    coordinateStatus: 'Provided',
    aiVisitorCountingAvailable: true,
    aiVisitorCountingMethod: 'CCTV Cam',
    aiVisitorCountingCameraCount: 30,
  },
  {
    municipality: 'ADM',
    smartParkNameEn: 'Corniche Park',
    smartParkNameAr: 'حديقة الكورنيش',
    aliases: ['Corniche Park', 'Corniche Beach', 'Corniche Beach Park', 'حديقة الكورنيش', 'حديقة شاطئ الكورنيش'],
    capabilities: smartParkCapabilities,
    isSmartPark: true,
    dmtIntegrationStatus: 'Integrated',
    dmtIntegrationConfirmed: true,
    dmtIntegrationScope,
    smartSystemAvailable: true,
    hasSensors: true,
    hasCameras: true,
    latitude: 24.467,
    longitude: 54.3289,
    coordinateStatus: 'Provided',
    aiVisitorCountingAvailable: false,
    aiVisitorCountingCameraCount: 0,
    smartParkNote: 'No CCTV visitor counting cameras',
  },
  {
    municipality: 'ADM',
    smartParkNameEn: 'Family Park B',
    smartParkNameAr: 'حديقة العائلة B',
    aliases: ['Family Park B', 'حديقة العائلة B', 'حديقة العائلة ب', 'حديقة العائلة - ب'],
    capabilities: smartParkCapabilities,
    isSmartPark: true,
    dmtIntegrationStatus: 'Integrated',
    dmtIntegrationConfirmed: true,
    dmtIntegrationScope,
    smartSystemAvailable: true,
    hasSensors: true,
    hasCameras: true,
    latitude: 24.4824,
    longitude: 54.3487,
    coordinateStatus: 'Provided',
    aiVisitorCountingAvailable: true,
    aiVisitorCountingMethod: 'CCTV Cam',
    aiVisitorCountingCameraCount: 41,
  },
  {
    municipality: 'AAM',
    smartParkNameEn: 'Al Jahili Park',
    smartParkNameAr: 'حديقة الجاهلي',
    aliases: ['Al Jahili Park', 'Jahli Park', 'Al Jahli Park', 'Al Jahli Park - Al Ain', 'حديقة الجاهلي'],
    capabilities: smartParkCapabilities,
    isSmartPark: true,
    dmtIntegrationStatus: 'Integrated',
    dmtIntegrationConfirmed: true,
    dmtIntegrationScope,
    smartSystemAvailable: true,
    hasSensors: true,
    hasCameras: true,
    latitude: 24.2163,
    longitude: 55.7536,
    coordinateStatus: 'Provided',
    aiVisitorCountingAvailable: true,
    aiVisitorCountingMethod: 'CCTV Cam',
    aiVisitorCountingCameraCount: 50,
  },
  {
    municipality: 'AAM',
    smartParkNameEn: 'Al Towayya Park',
    smartParkNameAr: 'حديقة الطوية',
    aliases: ['Al Towayya Park', 'Towayya Park', 'Towayya Park - Al Ain', 'حديقة الطوية', 'Al Towayya'],
    capabilities: smartParkCapabilities,
    isSmartPark: true,
    dmtIntegrationStatus: 'Integrated',
    dmtIntegrationConfirmed: true,
    dmtIntegrationScope,
    smartSystemAvailable: true,
    hasSensors: true,
    hasCameras: true,
    latitude: 24.243,
    longitude: 55.701,
    coordinateStatus: 'Provided',
    aiVisitorCountingAvailable: true,
    aiVisitorCountingMethod: 'CCTV Cam',
    aiVisitorCountingCameraCount: 45,
  },
  {
    municipality: 'DRM',
    smartParkNameEn: 'Sheikha Salama bint Butti Park',
    smartParkNameAr: 'حديقة الشيخة سلامة بنت بطي',
    aliases: [
      'Sheikha Salama bint Butti Park',
      'حديقة الشيخة سلامة بنت بطي',
      'حديقة الشيخة سلامة بن بطي',
      'حديقة الشيخة سلامة بن بوطي',
      'منتزه الشيخة سلامة بنت بطي',
      'Sheikha Salama Park',
      'Sh. Salama bint Butti Park',
      'Shaikha Salama Park',
      'Shaikha Salama bint Butti Park',
    ],
    capabilities: smartParkCapabilities,
    isSmartPark: true,
    dmtIntegrationStatus: 'Integrated',
    dmtIntegrationConfirmed: true,
    dmtIntegrationScope,
    smartSystemAvailable: true,
    hasSensors: true,
    hasCameras: true,
    latitude: 23.66667,
    longitude: 53.70016,
    coordinateStatus: 'Provided',
    aiVisitorCountingAvailable: true,
    aiVisitorCountingMethod: 'CCTV Cam',
    aiVisitorCountingCameraCount: 36,
  },
];

export function normalizeSmartParkMatchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[إأآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isAliasMatch(parkName: string, alias: string): boolean {
  const normalizedParkName = normalizeSmartParkMatchText(parkName);
  const normalizedAlias = normalizeSmartParkMatchText(alias);

  if (!normalizedParkName || !normalizedAlias) {
    return false;
  }

  return normalizedParkName === normalizedAlias || normalizedParkName.includes(normalizedAlias);
}

export function findConfirmedSmartParkMatch(park: ParkRecord): ConfirmedSmartPark | undefined {
  if (!['ADM', 'AAM', 'DRM'].includes(park.municipality)) {
    return undefined;
  }

  return confirmedSmartParks.find(
    (smartPark) =>
      smartPark.municipality === park.municipality &&
      [smartPark.smartParkNameEn, smartPark.smartParkNameAr, ...smartPark.aliases]
        .filter((alias): alias is string => Boolean(alias))
        .some((alias) => isAliasMatch(park.parkName, alias)),
  );
}

export function enrichWithConfirmedSmartPark(park: ParkRecord): ParkRecord {
  const smartPark = findConfirmedSmartParkMatch(park);

  if (!smartPark) {
    return {
      ...park,
      isSmartPark: false,
    };
  }

  const hasProvidedCoordinates = typeof smartPark.latitude === 'number' && typeof smartPark.longitude === 'number';

  return {
    ...park,
    isSmartPark: true,
    smartParkMatchedName: smartPark.smartParkNameEn,
    smartParkCapabilities: smartPark.capabilities,
    smartSystemAvailable: smartPark.smartSystemAvailable,
    hasSensors: smartPark.hasSensors,
    dmtIntegrationStatus: smartPark.dmtIntegrationStatus,
    dmtIntegrationConfirmed: smartPark.dmtIntegrationConfirmed,
    dmtIntegrationScope: smartPark.dmtIntegrationScope,
    aiVisitorCountingAvailable: smartPark.aiVisitorCountingAvailable,
    aiVisitorCountingMethod: smartPark.aiVisitorCountingMethod,
    aiVisitorCountingCameraCount: smartPark.aiVisitorCountingCameraCount,
    smartParkNote: smartPark.smartParkNote,
    coordinateSource: hasProvidedCoordinates ? 'Confirmed Smart Park GPS' : park.coordinateSource,
    coordinateConversionStatus: hasProvidedCoordinates ? 'Ready for Map' : park.coordinateConversionStatus,
    canPlotOnMap: hasProvidedCoordinates ? true : park.canPlotOnMap,
    latitude: hasProvidedCoordinates ? smartPark.latitude : park.latitude,
    longitude: hasProvidedCoordinates ? smartPark.longitude : park.longitude,
  };
}

import type { ParkRecord } from '../types/park';

export type ConfirmedSmartPark = {
  municipality: 'ADM' | 'AAM' | 'DRM';
  smartParkNameEn: string;
  smartParkNameAr?: string;
  aliases: string[];
  capabilities: string[];
  smartSystemAvailable: true;
  hasSensors: true;
  hasCameras: true;
  xCoordinate?: number | string;
  yCoordinate?: number | string;
  latitude?: number;
  longitude?: number;
  coordinateStatus?: 'Provided' | 'Pending' | 'Matched from Excel' | 'Needs CRS Conversion';
};

const smartParkCapabilities = ['Cameras', 'Sensors', 'Smart sensor management system'];

export const confirmedSmartParks: ConfirmedSmartPark[] = [
  {
    municipality: 'ADM',
    smartParkNameEn: 'Family Park B',
    smartParkNameAr: 'حديقة العائلة ب',
    aliases: ['Family Park B', 'حديقة العائلة ب', 'حديقة العائلة - ب'],
    capabilities: smartParkCapabilities,
    smartSystemAvailable: true,
    hasSensors: true,
    hasCameras: true,
    coordinateStatus: 'Pending',
  },
  {
    municipality: 'ADM',
    smartParkNameEn: 'Dalma Park',
    smartParkNameAr: 'حديقة دلما',
    aliases: ['Dalma Park', 'حديقة دلما', 'Delma Park'],
    capabilities: smartParkCapabilities,
    smartSystemAvailable: true,
    hasSensors: true,
    hasCameras: true,
    coordinateStatus: 'Pending',
  },
  {
    municipality: 'ADM',
    smartParkNameEn: 'Corniche Beach Park',
    smartParkNameAr: 'حديقة شاطئ الكورنيش',
    aliases: ['Corniche Beach Park', 'حديقة شاطئ الكورنيش', 'Corniche Park', 'كورنيش بيتش بارك'],
    capabilities: smartParkCapabilities,
    smartSystemAvailable: true,
    hasSensors: true,
    hasCameras: true,
    coordinateStatus: 'Pending',
  },
  {
    municipality: 'AAM',
    smartParkNameEn: 'Al Jahili Park',
    smartParkNameAr: 'حديقة الجاهلي',
    aliases: ['Al Jahili Park', 'حديقة الجاهلي'],
    capabilities: smartParkCapabilities,
    smartSystemAvailable: true,
    hasSensors: true,
    hasCameras: true,
    coordinateStatus: 'Pending',
  },
  {
    municipality: 'AAM',
    smartParkNameEn: 'Al Towayya Park',
    smartParkNameAr: 'حديقة الطوية',
    aliases: ['Al Towayya Park', 'حديقة الطوية', 'Al Towayya'],
    capabilities: smartParkCapabilities,
    smartSystemAvailable: true,
    hasSensors: true,
    hasCameras: true,
    coordinateStatus: 'Pending',
  },
  {
    municipality: 'DRM',
    smartParkNameEn: 'Sheikha Salama bint Butti Park',
    smartParkNameAr: 'حديقة الشيخة سلامة بن بطي',
    aliases: [
      'Sheikha Salama bint Butti Park',
      'حديقة الشيخة سلامة بن بطي',
      'حديقة الشيخة سلامة بن بوطي',
      'منتزه الشيخة سلامة بنت بطي',
      'Sheikha Salama Park',
    ],
    capabilities: smartParkCapabilities,
    smartSystemAvailable: true,
    hasSensors: true,
    hasCameras: true,
    coordinateStatus: 'Pending',
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

  return {
    ...park,
    isSmartPark: true,
    smartParkMatchedName: smartPark.smartParkNameEn,
    smartParkCapabilities: smartPark.capabilities,
    smartSystemAvailable: smartPark.smartSystemAvailable,
    hasSensors: smartPark.hasSensors,
  };
}

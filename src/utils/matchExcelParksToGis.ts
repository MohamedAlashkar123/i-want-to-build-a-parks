import type { GisParkRecord } from '../data/loadGisParks';
import type { ParkRecord } from '../types/park';
import type { UnifiedParkRecord } from '../types/unifiedPark';
import { namesLikelyMatch, normalizeArabicName, normalizeEnglishName, normalizeParkName } from './nameNormalization';

type MatchResult = {
  matchedGisPark?: GisParkRecord;
  matchStatus: 'Matched' | 'Unmatched';
  matchScore: number;
  reason?: string;
};

function municipalitiesCompatible(excelPark: ParkRecord, gisPark: GisParkRecord): boolean {
  return excelPark.municipality === 'Unknown' || gisPark.municipality === 'Unknown' || excelPark.municipality === gisPark.municipality;
}

function hasArabic(value: string | undefined): boolean {
  return Boolean(value && /[\u0600-\u06FF]/.test(value));
}

function hasEnglish(value: string | undefined): boolean {
  return Boolean(value && /[A-Za-z]/.test(value));
}

function scoreCandidate(excelPark: ParkRecord, gisPark: GisParkRecord): { score: number; reason?: string } {
  if (!municipalitiesCompatible(excelPark, gisPark)) {
    return { score: 0, reason: 'Municipality mismatch' };
  }

  const excelName = excelPark.parkName;
  const gisArabicName = gisPark.parkNameAr;
  const gisEnglishName = gisPark.parkNameEn;
  const municipalityMatches = excelPark.municipality !== 'Unknown' && excelPark.municipality === gisPark.municipality;

  if (hasArabic(excelName) && gisArabicName) {
    const normalizedExcelArabic = normalizeArabicName(excelName);
    const normalizedGisArabic = normalizeArabicName(gisArabicName);

    if (normalizedExcelArabic && normalizedExcelArabic === normalizedGisArabic) {
      return { score: 1, reason: 'Exact normalized Arabic name match' };
    }
  }

  if (hasEnglish(excelName) && gisEnglishName) {
    const normalizedExcelEnglish = normalizeEnglishName(excelName);
    const normalizedGisEnglish = normalizeEnglishName(gisEnglishName);

    if (normalizedExcelEnglish && normalizedExcelEnglish === normalizedGisEnglish) {
      return { score: 0.98, reason: 'Exact normalized English name match' };
    }
  }

  if (municipalityMatches) {
    const gisNames = [gisArabicName, gisEnglishName, gisPark.parkName].filter((value): value is string => Boolean(value));
    const containsMatch = gisNames.find((gisName) => namesLikelyMatch(excelName, gisName));

    if (containsMatch) {
      return { score: 0.82, reason: `Safe contains match within municipality: ${normalizeParkName(containsMatch)}` };
    }
  }

  return { score: 0, reason: 'No reliable name match' };
}

export function matchExcelParkToGis(excelPark: ParkRecord, gisParks: GisParkRecord[]): MatchResult {
  const compatibleGisParks = gisParks.filter((gisPark) => municipalitiesCompatible(excelPark, gisPark));
  let bestMatch: MatchResult = {
    matchStatus: 'Unmatched',
    matchScore: 0,
    reason: compatibleGisParks.length === 0 ? 'No GIS parks with compatible municipality' : 'No reliable name match',
  };

  compatibleGisParks.forEach((gisPark) => {
    const candidate = scoreCandidate(excelPark, gisPark);

    if (candidate.score > bestMatch.matchScore) {
      bestMatch = {
        matchedGisPark: gisPark,
        matchStatus: candidate.score > 0 ? 'Matched' : 'Unmatched',
        matchScore: candidate.score,
        reason: candidate.reason,
      };
    }
  });

  return bestMatch.matchStatus === 'Matched' ? bestMatch : { ...bestMatch, matchedGisPark: undefined };
}

function coordinateStatusFromExcelPark(excelPark: ParkRecord): UnifiedParkRecord['coordinateStatus'] {
  if (excelPark.canPlotOnMap) {
    return 'Ready for Map';
  }

  if (excelPark.coordinateConversionStatus === 'Missing') {
    return 'Missing';
  }

  if (
    excelPark.coordinateConversionStatus === 'Pending CRS Confirmation' ||
    excelPark.coordinateConversionStatus === 'Conversion Review Required'
  ) {
    return 'Pending Review';
  }

  return 'Invalid';
}

function dmtStatusFromExcelPark(excelPark: ParkRecord): UnifiedParkRecord['dmtIntegrationStatus'] {
  if (excelPark.dmtIntegrationStatus === 'Integrated') {
    return 'Integrated';
  }

  return excelPark.isSmartPark ? 'Integrated' : 'Not Confirmed';
}

function toUnifiedPark(excelPark: ParkRecord, match: MatchResult): UnifiedParkRecord {
  const matchedGisPark = match.matchedGisPark;
  const useGisCoordinates = Boolean(matchedGisPark && excelPark.coordinateSource !== 'Confirmed Smart Park GPS');

  return {
    id: excelPark.id,
    municipality: excelPark.municipality,
    parkName: excelPark.parkName,
    parkNameAr: matchedGisPark?.parkNameAr,
    parkNameEn: matchedGisPark?.parkNameEn,
    region: excelPark.region,
    parkType: excelPark.parkType ?? matchedGisPark?.parkType,

    sourceSheet: excelPark.sourceSheet,
    sourceRowNumber: excelPark.sourceRowNumber,
    hasCctvSystem: excelPark.hasCctvSystem,
    totalCameras: excelPark.totalCameras,
    maintenanceContract: excelPark.hasMaintenanceContract,
    maintenanceCompany: excelPark.maintenanceCompany,
    hasDrawings: excelPark.hasDrawings,

    gisId: matchedGisPark?.gisId,
    latitude: useGisCoordinates ? matchedGisPark?.latitude : excelPark.latitude ?? undefined,
    longitude: useGisCoordinates ? matchedGisPark?.longitude : excelPark.longitude ?? undefined,
    xCoord: matchedGisPark?.xCoord ?? excelPark.xyParsedX ?? undefined,
    yCoord: matchedGisPark?.yCoord ?? excelPark.xyParsedY ?? undefined,
    parkAreaSqm: matchedGisPark?.parkAreaSqm,
    coordinateSource: useGisCoordinates ? 'GIS Geodatabase' : excelPark.coordinateSource,
    coordinateStatus: useGisCoordinates ? 'Ready for Map' : coordinateStatusFromExcelPark(excelPark),
    canPlotOnMap: useGisCoordinates ? true : excelPark.canPlotOnMap,

    isSmartPark: excelPark.isSmartPark,
    smartParkCapabilities: excelPark.smartParkCapabilities,
    dmtIntegrationStatus: dmtStatusFromExcelPark(excelPark),
    aiVisitorCountingAvailable: excelPark.aiVisitorCountingAvailable,
    aiVisitorCountingCameraCount: excelPark.aiVisitorCountingCameraCount,
    smartParkNote: excelPark.smartParkNote,

    gisMatchStatus: match.matchStatus,
    gisMatchScore: match.matchScore,
    gisMatchedName: matchedGisPark?.parkName,

    dataQualityIssues: excelPark.dataQualityIssues,
  };
}

function logMatchSummary(records: UnifiedParkRecord[], excelTotal: number, gisTotal: number) {
  if (!import.meta.env.DEV) {
    return;
  }

  const matchedRecords = records.filter((record) => record.gisMatchStatus === 'Matched');
  const matchedByMunicipality = matchedRecords.reduce<Record<string, number>>((summary, record) => {
    summary[record.municipality] = (summary[record.municipality] ?? 0) + 1;
    return summary;
  }, {});

  console.log('Excel to GIS match summary', {
    excelTotal,
    gisTotal,
    matchedCount: matchedRecords.length,
    unmatchedCount: records.length - matchedRecords.length,
    matchedByMunicipality,
    first10UnmatchedSampleNames: records
      .filter((record) => record.gisMatchStatus !== 'Matched')
      .slice(0, 10)
      .map((record) => record.parkName),
  });
}

export function enrichParksWithGis(excelParks: ParkRecord[], gisParks: GisParkRecord[]): UnifiedParkRecord[] {
  const records = excelParks.map((excelPark) => toUnifiedPark(excelPark, matchExcelParkToGis(excelPark, gisParks)));

  logMatchSummary(records, excelParks.length, gisParks.length);

  return records;
}

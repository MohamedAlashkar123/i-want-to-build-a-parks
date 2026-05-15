import type { ParkRecord } from '../types/park';

export type GisReviewRecord = {
  municipality: ParkRecord['municipality'];
  parkName: string;
  region?: string;
  parkType?: string;
  coordinateRaw?: string;
  sourceSheet: string;
  sourceRowNumber: number;
  coordinateSource?: ParkRecord['coordinateSource'];
  coordinateConversionStatus?: ParkRecord['coordinateConversionStatus'];
};

export type GisDataQualitySummary = {
  readyForMap: number;
  convertedAdmXy: number;
  convertedAamXy: number;
  convertedDrmXy: number;
  projectedXy: number;
  missingOrInvalid: number;
};

function toReviewRecord(park: ParkRecord): GisReviewRecord {
  return {
    municipality: park.municipality,
    parkName: park.parkName,
    region: park.region,
    parkType: park.parkType,
    coordinateRaw: park.coordinateRaw,
    sourceSheet: park.sourceSheet,
    sourceRowNumber: park.sourceRowNumber,
    coordinateSource: park.coordinateSource,
    coordinateConversionStatus: park.coordinateConversionStatus,
  };
}

export function getProjectedXYRecords(parks: ParkRecord[]): GisReviewRecord[] {
  return parks
    .filter(
      (park) =>
        park.coordinateSource === 'Projected XY' ||
        park.coordinateConversionStatus === 'Pending CRS Confirmation' ||
        park.coordinateConversionStatus === 'Conversion Review Required',
    )
    .map(toReviewRecord);
}

export function getMissingGisRecords(parks: ParkRecord[]): GisReviewRecord[] {
  return parks
    .filter(
      (park) =>
        !park.canPlotOnMap &&
        (park.coordinateConversionStatus === 'Missing' ||
          park.coordinateConversionStatus === 'Invalid' ||
          park.coordinateSource === 'Missing' ||
          park.coordinateSource === 'Unknown'),
    )
    .map(toReviewRecord);
}

export function getReadyForMapRecords(parks: ParkRecord[]): GisReviewRecord[] {
  return parks.filter((park) => park.canPlotOnMap).map(toReviewRecord);
}

export function getGisDataQualitySummary(parks: ParkRecord[]): GisDataQualitySummary {
  return {
    readyForMap: getReadyForMapRecords(parks).length,
    convertedAdmXy: parks.filter((park) => park.coordinateSource === 'Converted ADM X/Y' && park.canPlotOnMap).length,
    convertedAamXy: parks.filter((park) => park.coordinateSource === 'Converted AAM X/Y' && park.canPlotOnMap).length,
    convertedDrmXy: parks.filter((park) => park.coordinateSource === 'Converted DRM X/Y' && park.canPlotOnMap).length,
    projectedXy: getProjectedXYRecords(parks).length,
    missingOrInvalid: getMissingGisRecords(parks).length,
  };
}

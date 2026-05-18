import type { ParkRecord } from '../types/park';
import { confirmedSmartParks } from '../data/confirmedSmartParks';

function hasValidGisCoordinates(park: ParkRecord): boolean {
  return (
    typeof park.latitude === 'number' &&
    typeof park.longitude === 'number' &&
    Number.isFinite(park.latitude) &&
    Number.isFinite(park.longitude) &&
    park.latitude >= -90 &&
    park.latitude <= 90 &&
    park.longitude >= -180 &&
    park.longitude <= 180
  );
}

export function isInventoryPark(park: ParkRecord): boolean {
  return park.gisMatchStatus !== 'Manual' && park.sourceSheet !== 'Confirmed Smart Parks';
}

function inventoryParks(parks: ParkRecord[]): ParkRecord[] {
  return parks.filter(isInventoryPark);
}

export function getTotalParks(parks: ParkRecord[]): number {
  return inventoryParks(parks).length;
}

export function getParksWithCctv(parks: ParkRecord[]): number {
  return inventoryParks(parks).filter((park) => park.hasCctvSystem === 'Yes').length;
}

export function getParksWithoutCctv(parks: ParkRecord[]): number {
  return inventoryParks(parks).filter((park) => park.hasCctvSystem === 'No').length;
}

export function getUnknownCctvStatus(parks: ParkRecord[]): number {
  return inventoryParks(parks).filter((park) => park.hasCctvSystem === 'Unknown').length;
}

export function getTotalCameras(parks: ParkRecord[]): number {
  return inventoryParks(parks).reduce((total, park) => total + park.totalCameras, 0);
}

export function getParksWithMaintenanceContract(parks: ParkRecord[]): number {
  return inventoryParks(parks).filter((park) => park.hasMaintenanceContract === 'Yes').length;
}

export function getParksWithoutMaintenanceContract(parks: ParkRecord[]): number {
  return inventoryParks(parks).filter((park) => park.hasMaintenanceContract === 'No').length;
}

export function getUnknownMaintenanceContract(parks: ParkRecord[]): number {
  return inventoryParks(parks).filter((park) => park.hasMaintenanceContract === 'Unknown').length;
}

export function getParksWithDrawings(parks: ParkRecord[]): number {
  return inventoryParks(parks).filter((park) => park.hasDrawings === 'Yes').length;
}

export function getParksWithoutDrawings(parks: ParkRecord[]): number {
  return inventoryParks(parks).filter((park) => park.hasDrawings === 'No').length;
}

export function getValidGisCoordinatesCount(parks: ParkRecord[]): number {
  return parks.filter(hasValidGisCoordinates).length;
}

export function getMissingGisCoordinatesCount(parks: ParkRecord[]): number {
  return parks.length - getValidGisCoordinatesCount(parks);
}

export function getDmtIntegratedParks(parks: ParkRecord[]): number {
  return parks.filter((park) => park.isSmartPark && park.dmtIntegrationStatus === 'Integrated').length;
}

export function getStandaloneCameraSetupCount(parks: ParkRecord[]): number {
  return inventoryParks(parks).filter((park) => park.cameraSetupType === 'Standalone').length;
}

export function getCctvParkPercentage(parks: ParkRecord[]): number {
  const inventoryCount = getTotalParks(parks);

  if (inventoryCount === 0) {
    return 0;
  }

  return (getParksWithCctv(parks) / inventoryCount) * 100;
}

export function getSmartParksCount(parks: ParkRecord[]): number {
  if (parks.length === 0) {
    return 0;
  }

  return confirmedSmartParks.length;
}

export type ChartDataPoint = {
  name: string;
  value: number;
};

export type MunicipalitySummaryRow = {
  municipality: 'ADM' | 'AAM' | 'DRM';
  totalParks: number;
  parksWithCctv: number;
  parksWithoutCctv: number;
  unknownCctv: number;
  totalCameras: number;
  validGis: number;
  missingOrInvalidGis: number;
  projectedXy: number;
  maintenanceContracts: number;
};

export type CctvAvailabilityByMunicipalityChartRow = {
  municipality: 'ADM' | 'AAM' | 'DRM';
  withCctv: number;
  withoutCctv: number;
  unknownCctv: number;
};

export type SmartParksByMunicipalityRow = {
  municipality: 'ADM' | 'AAM' | 'DRM';
  smartParks: number;
};

function hasMapReadyCoordinates(park: ParkRecord): boolean {
  return park.canPlotOnMap === true || (park.canPlotOnMap === undefined && hasValidGisCoordinates(park));
}

export function getMunicipalitySummary(parks: ParkRecord[]): MunicipalitySummaryRow[] {
  return (['ADM', 'AAM', 'DRM'] as const).map((municipality) => {
    const municipalityParks = inventoryParks(parks).filter((park) => park.municipality === municipality);
    const municipalityMapRecords = parks.filter((park) => park.municipality === municipality);
    const validGis = municipalityMapRecords.filter(hasMapReadyCoordinates).length;
    const projectedXy = municipalityMapRecords.filter(
      (park) => park.coordinateSource === 'Projected XY' || park.coordinateConversionStatus === 'Conversion Review Required',
    ).length;

    return {
      municipality,
      totalParks: municipalityParks.length,
      parksWithCctv: municipalityParks.filter((park) => park.hasCctvSystem === 'Yes').length,
      parksWithoutCctv: municipalityParks.filter((park) => park.hasCctvSystem === 'No').length,
      unknownCctv: municipalityParks.filter((park) => park.hasCctvSystem === 'Unknown').length,
      totalCameras: municipalityParks.reduce((total, park) => total + park.totalCameras, 0),
      validGis,
      missingOrInvalidGis: Math.max(0, municipalityParks.length - validGis),
      projectedXy,
      maintenanceContracts: municipalityParks.filter((park) => park.hasMaintenanceContract === 'Yes').length,
    };
  });
}

export function getSmartParksByMunicipality(parks: ParkRecord[]): SmartParksByMunicipalityRow[] {
  return (['ADM', 'AAM', 'DRM'] as const).map((municipality) => ({
    municipality,
    smartParks:
      parks.length === 0 ? 0 : confirmedSmartParks.filter((smartPark) => smartPark.municipality === municipality).length,
  }));
}

export function getSmartParksWithVisitorCountingCount(parks: ParkRecord[]): number {
  return parks.length === 0
    ? 0
    : confirmedSmartParks.filter(
        (smartPark) => smartPark.aiVisitorCountingAvailable && smartPark.aiVisitorCountingCameraCount > 0,
      ).length;
}

export function getTotalVisitorCountingCameras(parks: ParkRecord[]): number {
  return parks.length === 0
    ? 0
    : confirmedSmartParks.reduce((total, smartPark) => total + smartPark.aiVisitorCountingCameraCount, 0);
}

export function getSmartParksWithoutVisitorCountingCctvCount(parks: ParkRecord[]): number {
  return parks.length === 0
    ? 0
    : confirmedSmartParks.filter(
        (smartPark) => !smartPark.aiVisitorCountingAvailable || smartPark.aiVisitorCountingCameraCount === 0,
      ).length;
}

export function getDmtIntegratedSmartParksCount(parks: ParkRecord[]): number {
  return parks.length === 0
    ? 0
    : confirmedSmartParks.filter((smartPark) => smartPark.dmtIntegrationConfirmed).length;
}

export function getAiVisitorCountingParks(parks: ParkRecord[]): number {
  return getSmartParksWithVisitorCountingCount(parks);
}

export function getSmartParksWithoutAiVisitorCounting(parks: ParkRecord[]): number {
  return getSmartParksWithoutVisitorCountingCctvCount(parks);
}

export function getAiVisitorCountingCameraTotal(parks: ParkRecord[]): number {
  return getTotalVisitorCountingCameras(parks);
}

export function getCctvStatusChartData(parks: ParkRecord[]): ChartDataPoint[] {
  return [
    { name: 'Parks with CCTV', value: getParksWithCctv(parks) },
    { name: 'Parks without CCTV', value: getParksWithoutCctv(parks) },
    { name: 'Unknown CCTV status', value: getUnknownCctvStatus(parks) },
  ];
}

export function getCamerasByMunicipalityChartData(parks: ParkRecord[]): ChartDataPoint[] {
  return (['ADM', 'AAM', 'DRM'] as const).map((municipality) => ({
    name: municipality,
    value: parks
      .filter((park) => park.municipality === municipality)
      .reduce((total, park) => total + park.totalCameras, 0),
  }));
}

export function getCctvAvailabilityByMunicipalityChartData(
  parks: ParkRecord[],
): CctvAvailabilityByMunicipalityChartRow[] {
  return (['ADM', 'AAM', 'DRM'] as const).map((municipality) => {
    const municipalityParks = parks.filter((park) => park.municipality === municipality);

    return {
      municipality,
      withCctv: municipalityParks.filter((park) => park.hasCctvSystem === 'Yes').length,
      withoutCctv: municipalityParks.filter((park) => park.hasCctvSystem === 'No').length,
      unknownCctv: municipalityParks.filter((park) => park.hasCctvSystem === 'Unknown').length,
    };
  });
}

export function getGisDataQualityChartData(parks: ParkRecord[]): ChartDataPoint[] {
  const readyForMap = parks.filter((park) => park.canPlotOnMap).length;
  const googleMaps = parks.filter((park) => park.coordinateSource === 'Google Maps' && park.canPlotOnMap).length;
  const convertedAdmXy = parks.filter((park) => park.coordinateSource === 'Converted ADM X/Y' && park.canPlotOnMap).length;
  const convertedAamXy = parks.filter((park) => park.coordinateSource === 'Converted AAM X/Y' && park.canPlotOnMap).length;
  const convertedDrmXy = parks.filter((park) => park.coordinateSource === 'Converted DRM X/Y' && park.canPlotOnMap).length;
  const projectedXy = parks.filter(
    (park) => park.coordinateSource === 'Projected XY' || park.coordinateConversionStatus === 'Conversion Review Required',
  ).length;
  const missingOrInvalid = parks.filter(
    (park) =>
      !park.canPlotOnMap &&
      (park.coordinateConversionStatus === 'Missing' ||
        park.coordinateConversionStatus === 'Invalid' ||
        park.coordinateSource === 'Missing' ||
        park.coordinateSource === 'Unknown'),
  ).length;

  return [
    { name: 'Ready for Map', value: readyForMap },
    { name: 'Extracted from Google Maps', value: googleMaps },
    { name: 'Converted ADM X/Y', value: convertedAdmXy },
    { name: 'Converted AAM X/Y', value: convertedAamXy },
    { name: 'Converted DRM X/Y', value: convertedDrmXy },
    { name: 'Projected X/Y Pending Review', value: projectedXy },
    { name: 'Missing or Invalid GIS', value: missingOrInvalid },
  ];
}

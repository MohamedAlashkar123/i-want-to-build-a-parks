import type { ParkRecord } from '../types/park';
import type { UnifiedParkRecord } from '../types/unifiedPark';

type UnifiedParksGeoJson = GeoJSON.FeatureCollection<GeoJSON.Point>;

const unifiedParksUrl = '/data/parks_unified.json';
const unifiedParksGeoJsonUrl = '/data/parks_unified_points.geojson';

function asNumber(value: number | undefined): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function mapDmtStatus(status: UnifiedParkRecord['dmtIntegrationStatus']): ParkRecord['dmtIntegrationStatus'] {
  return status === 'Integrated' ? 'Integrated' : 'Not Confirmed';
}

function mapCoordinateStatus(status: UnifiedParkRecord['coordinateStatus']): ParkRecord['coordinateConversionStatus'] {
  if (status === 'Ready for Map') {
    return 'Ready for Map';
  }

  if (status === 'Missing') {
    return 'Missing';
  }

  if (status === 'Pending Review') {
    return 'Conversion Review Required';
  }

  return 'Invalid';
}

export async function loadUnifiedParks(): Promise<UnifiedParkRecord[]> {
  const response = await fetch(unifiedParksUrl);

  if (!response.ok) {
    throw new Error(`Unable to load unified parks dataset: ${response.status}`);
  }

  const records = (await response.json()) as unknown;

  if (!Array.isArray(records)) {
    throw new Error('Unified parks dataset is not an array.');
  }

  return records as UnifiedParkRecord[];
}

export async function loadUnifiedParksGeoJson(): Promise<UnifiedParksGeoJson> {
  const response = await fetch(unifiedParksGeoJsonUrl);

  if (!response.ok) {
    throw new Error(`Unable to load unified parks GeoJSON: ${response.status}`);
  }

  return (await response.json()) as UnifiedParksGeoJson;
}

export function unifiedParkToParkRecord(record: UnifiedParkRecord): ParkRecord {
  const latitude = asNumber(record.latitude) ?? null;
  const longitude = asNumber(record.longitude) ?? null;
  const hasMaintenanceContract = record.maintenanceContract ?? 'Unknown';
  const hasCctvSystem = record.hasCctvSystem ?? 'Unknown';
  const hasDrawings = record.hasDrawings ?? 'Unknown';
  const totalCameras = record.totalCameras ?? 0;
  const dataQualityIssues = [...(record.dataQualityIssues ?? [])];

  if (!record.canPlotOnMap && !dataQualityIssues.includes('Missing or invalid GIS coordinates')) {
    dataQualityIssues.push('Missing or invalid GIS coordinates');
  }

  return {
    id: record.id,
    sourceSheet: record.sourceSheet ?? (record.gisMatchStatus === 'Manual' ? 'Confirmed Smart Parks' : 'Unified dataset'),
    sourceRowNumber: record.sourceRowNumber ?? 0,
    municipality: record.municipality,
    parkName: record.parkName,
    region: record.region,
    parkType: record.parkType,
    parkImageUrl: record.parkImageUrl,
    coordinateRaw:
      record.xCoord !== undefined && record.yCoord !== undefined ? `${record.xCoord}, ${record.yCoord}` : undefined,
    coordinateSource: record.coordinateSource as ParkRecord['coordinateSource'],
    coordinateConversionStatus: mapCoordinateStatus(record.coordinateStatus),
    canPlotOnMap: record.canPlotOnMap,
    latitude,
    longitude,
    xyParsedX: record.xCoord ?? null,
    xyParsedY: record.yCoord ?? null,
    hasCctvSystem,
    totalCameras,
    hasMaintenanceContract,
    maintenanceCompany: record.maintenanceCompany,
    hasDrawings,
    cameraSetupType: 'Standalone',
    dmtIntegrationStatus: mapDmtStatus(record.dmtIntegrationStatus),
    isSmartPark: record.isSmartPark,
    smartParkMatchedName: record.parkNameEn ?? record.gisMatchedName,
    smartParkCapabilities: record.smartParkCapabilities,
    smartSystemAvailable: record.isSmartPark,
    hasSensors: record.isSmartPark,
    dmtIntegrationConfirmed: record.dmtIntegrationStatus === 'Integrated',
    gisMatchStatus: record.gisMatchStatus,
    gisMatchScore: record.gisMatchScore,
    gisMatchedName: record.gisMatchedName,
    aiVisitorCountingAvailable: record.aiVisitorCountingAvailable,
    aiVisitorCountingCameraCount: record.aiVisitorCountingCameraCount,
    smartParkNote: record.smartParkNote,
    dataQualityIssues,
  };
}

export async function loadUnifiedParksAsParkRecords(): Promise<ParkRecord[]> {
  const records = await loadUnifiedParks();
  return records.map(unifiedParkToParkRecord);
}

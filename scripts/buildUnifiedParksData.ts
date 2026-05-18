import ExcelJS from 'exceljs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { excelFileName } from '../src/data/loadExcel';
import {
  confirmedSmartParks,
  normalizeSmartParkMatchText,
  type ConfirmedSmartPark,
} from '../src/data/confirmedSmartParks';
import type { GisParkRecord } from '../src/data/loadGisParks';
import { normalizeWorkbookToParks } from '../src/data/normalizeParks';
import type { UnifiedParkRecord } from '../src/types/unifiedPark';
import { enrichParksWithGis } from '../src/utils/matchExcelParksToGis';

type GeoJsonPointFeature = {
  type: 'Feature';
  geometry?: {
    type?: string;
    coordinates?: unknown;
  };
  properties?: Record<string, unknown>;
};

type GeoJsonFeatureCollection = {
  type: 'FeatureCollection';
  features?: GeoJsonPointFeature[];
};

type Municipality = UnifiedParkRecord['municipality'];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');
const dataDir = path.join(publicDir, 'data');
const excelPath = path.join(publicDir, excelFileName);
const gisPointsPath = path.join(dataDir, 'dmt_parks_gis_points_wgs84_normalized.geojson');

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function asMunicipality(value: unknown): Municipality {
  return value === 'ADM' || value === 'AAM' || value === 'DRM' ? value : 'Unknown';
}

function isValidUaeLatLng(latitude: number, longitude: number): boolean {
  return latitude >= 22 && latitude <= 26 && longitude >= 51 && longitude <= 57;
}

function featureToGisPark(feature: GeoJsonPointFeature): GisParkRecord | undefined {
  if (feature.geometry?.type !== 'Point' || !Array.isArray(feature.geometry.coordinates)) {
    return undefined;
  }

  const [longitudeValue, latitudeValue] = feature.geometry.coordinates;
  const longitude = asNumber(longitudeValue);
  const latitude = asNumber(latitudeValue);

  if (latitude === undefined || longitude === undefined || !isValidUaeLatLng(latitude, longitude)) {
    return undefined;
  }

  const properties = feature.properties ?? {};
  const parkNameAr = asString(properties.parkNameAr);
  const parkNameEn = asString(properties.parkNameEn);

  return {
    gisId: asString(properties.gisId),
    municipality: asMunicipality(properties.municipality),
    parkNameAr,
    parkNameEn,
    parkName: parkNameEn ?? parkNameAr ?? asString(properties.parkName) ?? 'Unnamed GIS Park',
    parkType: asString(properties.parkType),
    parkAreaSqm: asNumber(properties.parkAreaSqm),
    xCoord: asNumber(properties.xCoord),
    yCoord: asNumber(properties.yCoord),
    latitude,
    longitude,
    sourceLayer: asString(properties.sourceLayer),
    rawProperties: properties,
  };
}

async function loadExcelParks() {
  const excelBuffer = await readFile(excelPath);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(excelBuffer);
  return normalizeWorkbookToParks(workbook);
}

async function loadGisParksFromFile(): Promise<GisParkRecord[]> {
  const rawGeoJson = await readFile(gisPointsPath, 'utf8');
  const geoJson = JSON.parse(rawGeoJson) as GeoJsonFeatureCollection;
  const features = Array.isArray(geoJson.features) ? geoJson.features : [];
  return features.map(featureToGisPark).filter((record): record is GisParkRecord => Boolean(record));
}

function buildUnifiedPointsGeoJson(records: UnifiedParkRecord[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: 'FeatureCollection',
    features: records
      .filter(
        (record) =>
          record.canPlotOnMap &&
          typeof record.latitude === 'number' &&
          typeof record.longitude === 'number' &&
          Number.isFinite(record.latitude) &&
          Number.isFinite(record.longitude),
      )
      .map((record) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [record.longitude as number, record.latitude as number],
        },
        properties: {
          id: record.id,
          gisId: record.gisId,
          municipality: record.municipality,
          parkName: record.parkName,
          parkNameAr: record.parkNameAr,
          parkNameEn: record.parkNameEn,
          region: record.region,
          parkType: record.parkType,
          hasCctvSystem: record.hasCctvSystem,
          totalCameras: record.totalCameras,
          isSmartPark: record.isSmartPark,
          coordinateSource: record.coordinateSource,
          coordinateStatus: record.coordinateStatus,
          gisMatchStatus: record.gisMatchStatus,
          gisMatchScore: record.gisMatchScore,
        },
      })),
  };
}

function toManualSmartParkRecord(smartPark: ConfirmedSmartPark): UnifiedParkRecord {
  const hasCoordinates = typeof smartPark.latitude === 'number' && typeof smartPark.longitude === 'number';

  return {
    id: `confirmed-smart-park-${smartPark.municipality}-${smartPark.smartParkNameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    municipality: smartPark.municipality,
    parkName: smartPark.smartParkNameEn,
    parkNameAr: smartPark.smartParkNameAr,
    parkNameEn: smartPark.smartParkNameEn,
    latitude: smartPark.latitude,
    longitude: smartPark.longitude,
    coordinateSource: hasCoordinates ? 'Confirmed Smart Park GPS' : 'Missing',
    coordinateStatus: hasCoordinates ? 'Ready for Map' : 'Missing',
    canPlotOnMap: hasCoordinates,
    isSmartPark: true,
    smartParkCapabilities: smartPark.capabilities,
    dmtIntegrationStatus: smartPark.dmtIntegrationStatus,
    aiVisitorCountingAvailable: smartPark.aiVisitorCountingAvailable,
    aiVisitorCountingCameraCount: smartPark.aiVisitorCountingCameraCount,
    smartParkNote: smartPark.smartParkNote,
    gisMatchStatus: 'Manual',
    gisMatchScore: 1,
    gisMatchedName: smartPark.smartParkNameEn,
    dataQualityIssues: ['Confirmed smart park added from project-team list; not matched to Excel inventory record'],
  };
}

function addMissingConfirmedSmartParks(records: UnifiedParkRecord[]): UnifiedParkRecord[] {
  const existingSmartParkRecords = records.filter((record) => record.isSmartPark);
  const smartParkAliases = (smartPark: ConfirmedSmartPark) =>
    [smartPark.smartParkNameEn, smartPark.smartParkNameAr, ...smartPark.aliases]
      .filter((alias): alias is string => Boolean(alias))
      .map(normalizeSmartParkMatchText);

  const missingSmartParks = confirmedSmartParks.filter((smartPark) => {
    const aliases = smartParkAliases(smartPark);

    return !existingSmartParkRecords.some((record) => {
      if (record.municipality !== smartPark.municipality) {
        return false;
      }

      const recordNames = [record.parkName, record.parkNameAr, record.parkNameEn, record.gisMatchedName]
        .filter((name): name is string => Boolean(name))
        .map(normalizeSmartParkMatchText);

      return recordNames.some((recordName) =>
        aliases.some((alias) => recordName === alias || recordName.includes(alias) || alias.includes(recordName)),
      );
    });
  });

  return [...records, ...missingSmartParks.map(toManualSmartParkRecord)];
}

function buildSummary(records: UnifiedParkRecord[], gisParks: GisParkRecord[], totalExcelRecords: number) {
  const matchedToGis = records.filter((record) => record.gisMatchStatus === 'Matched').length;
  const readyForMap = records.filter((record) => record.canPlotOnMap).length;
  const smartParks = records.filter((record) => record.isSmartPark).length;
  const dmtIntegratedSmartParks = records.filter((record) => record.isSmartPark && record.dmtIntegrationStatus === 'Integrated').length;
  const aiVisitorCountingParks = records.filter(
    (record) => record.isSmartPark && record.aiVisitorCountingAvailable === true && (record.aiVisitorCountingCameraCount ?? 0) > 0,
  ).length;
  const smartParksWithoutAiVisitorCounting = records.filter(
    (record) => record.isSmartPark && (!record.aiVisitorCountingAvailable || (record.aiVisitorCountingCameraCount ?? 0) === 0),
  ).length;
  const aiVisitorCountingCameras = records.reduce((total, record) => total + (record.aiVisitorCountingCameraCount ?? 0), 0);
  const municipalities: Municipality[] = ['ADM', 'AAM', 'DRM', 'Unknown'];

  return {
    totalExcelRecords,
    totalUnifiedRecords: records.length,
    totalGisRecords: gisParks.length,
    matchedToGis,
    unmatchedToGis: records.filter((record) => record.gisMatchStatus === 'Unmatched').length,
    manualSmartParkRecords: records.filter((record) => record.gisMatchStatus === 'Manual').length,
    readyForMap,
    missingCoordinates: records.length - readyForMap,
    smartParks,
    dmtIntegratedSmartParks,
    aiVisitorCountingParks,
    smartParksWithoutAiVisitorCounting,
    aiVisitorCountingCameras,
    byMunicipality: municipalities.reduce(
      (summary, municipality) => {
        const municipalityRecords = records.filter((record) => record.municipality === municipality);
        summary[municipality] = {
          total: municipalityRecords.length,
          matchedToGis: municipalityRecords.filter((record) => record.gisMatchStatus === 'Matched').length,
          readyForMap: municipalityRecords.filter((record) => record.canPlotOnMap).length,
          missingCoordinates: municipalityRecords.filter((record) => !record.canPlotOnMap).length,
          smartParks: municipalityRecords.filter((record) => record.isSmartPark).length,
        };
        return summary;
      },
      {} as Record<Municipality, Record<string, number>>,
    ),
  };
}

async function main() {
  await mkdir(dataDir, { recursive: true });

  const excelParks = await loadExcelParks();
  const gisParks = await loadGisParksFromFile();
  const unifiedParks = addMissingConfirmedSmartParks(enrichParksWithGis(excelParks, gisParks));
  const unifiedPoints = buildUnifiedPointsGeoJson(unifiedParks);
  const summary = buildSummary(unifiedParks, gisParks, excelParks.length);

  await writeFile(path.join(dataDir, 'parks_unified.json'), `${JSON.stringify(unifiedParks, null, 2)}\n`, 'utf8');
  await writeFile(path.join(dataDir, 'parks_unified_points.geojson'), `${JSON.stringify(unifiedPoints, null, 2)}\n`, 'utf8');
  await writeFile(path.join(dataDir, 'unified_data_quality_summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

  console.log('Unified parks data build complete');
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error('Unified parks data build failed');
  console.error(error);
  process.exitCode = 1;
});

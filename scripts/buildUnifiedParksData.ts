import ExcelJS from 'exceljs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { excelFileName } from '../src/data/loadExcel';
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

function buildSummary(records: UnifiedParkRecord[], gisParks: GisParkRecord[]) {
  const matchedToGis = records.filter((record) => record.gisMatchStatus === 'Matched').length;
  const readyForMap = records.filter((record) => record.canPlotOnMap).length;
  const smartParks = records.filter((record) => record.isSmartPark).length;
  const aiVisitorCountingParks = records.filter((record) => record.aiVisitorCountingAvailable).length;
  const aiVisitorCountingCameras = records.reduce((total, record) => total + (record.aiVisitorCountingCameraCount ?? 0), 0);
  const municipalities: Municipality[] = ['ADM', 'AAM', 'DRM', 'Unknown'];

  return {
    totalExcelRecords: records.length,
    totalGisRecords: gisParks.length,
    matchedToGis,
    unmatchedToGis: records.length - matchedToGis,
    readyForMap,
    missingCoordinates: records.length - readyForMap,
    smartParks,
    aiVisitorCountingParks,
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
  const unifiedParks = enrichParksWithGis(excelParks, gisParks);
  const unifiedPoints = buildUnifiedPointsGeoJson(unifiedParks);
  const summary = buildSummary(unifiedParks, gisParks);

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

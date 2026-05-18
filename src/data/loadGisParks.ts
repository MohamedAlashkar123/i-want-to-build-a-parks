export type GisParkRecord = {
  gisId?: string;
  municipality: 'ADM' | 'AAM' | 'DRM' | 'Unknown';
  parkNameAr?: string;
  parkNameEn?: string;
  parkName: string;
  parkType?: string;
  parkAreaSqm?: number;
  xCoord?: number;
  yCoord?: number;
  latitude: number;
  longitude: number;
  sourceLayer?: string;
  rawProperties: Record<string, unknown>;
};

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

const gisPointsUrl = '/data/dmt_parks_gis_points_wgs84_normalized.geojson';

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

function asMunicipality(value: unknown): GisParkRecord['municipality'] {
  return value === 'ADM' || value === 'AAM' || value === 'DRM' ? value : 'Unknown';
}

function isValidUaeLatLng(latitude: number, longitude: number): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= 22 &&
    latitude <= 26 &&
    longitude >= 51 &&
    longitude <= 57
  );
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

function logGisSummary(records: GisParkRecord[], totalFeatures: number) {
  if (!import.meta.env.DEV) {
    return;
  }

  const byMunicipality = records.reduce<Record<string, number>>((summary, record) => {
    summary[record.municipality] = (summary[record.municipality] ?? 0) + 1;
    return summary;
  }, {});

  console.log('GIS parks loaded', {
    totalGisParksLoaded: records.length,
    countByMunicipality: byMunicipality,
    invalidCoordinateCount: totalFeatures - records.length,
  });
}

export async function loadGisParks(): Promise<GisParkRecord[]> {
  const response = await fetch(gisPointsUrl);

  if (!response.ok) {
    throw new Error('Unable to load GIS park points GeoJSON.');
  }

  const geoJson = (await response.json()) as GeoJsonFeatureCollection;
  const features = Array.isArray(geoJson.features) ? geoJson.features : [];
  const records = features.map(featureToGisPark).filter((record): record is GisParkRecord => Boolean(record));

  logGisSummary(records, features.length);

  return records;
}

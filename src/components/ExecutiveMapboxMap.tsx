import mapboxgl from 'mapbox-gl';
import { Check, Info, Layers, LocateFixed, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ParkRecord } from '../types/park';
import { validateParkLocation } from '../utils/gisValidation';

type ExecutiveMapboxMapProps = {
  parks: ParkRecord[];
};

type PlottedPark = ParkRecord & {
  latitude: number;
  longitude: number;
};

type MarkerColor = 'green' | 'red' | 'gray' | 'orange';

type MapStyleOption = {
  label: string;
  style: string;
};

type FocusArea = 'All Plotted Parks' | 'ADM' | 'AAM' | 'DRM' | 'Smart Parks';

type ParkFeatureProperties = {
  id: string;
  parkName: string;
  municipality: string;
  region: string;
  parkType: string;
  hasCctvSystem: ParkRecord['hasCctvSystem'];
  totalCameras: number;
  hasMaintenanceContract: ParkRecord['hasMaintenanceContract'];
  maintenanceCompany: string;
  hasDrawings: ParkRecord['hasDrawings'];
  isSmartPark: boolean;
  smartParkCapabilities: string;
  aiVisitorCountingAvailable: boolean;
  aiVisitorCountingCameraCount: number;
  smartParkNote: string;
  dmtIntegrationStatus: string;
  dmtIntegrationScope: string;
  gisValidationStatus: string;
  gisValidationReason: string;
  markerColor: MarkerColor;
  isNeedsGisReview: boolean;
};

type ParkFeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Point, ParkFeatureProperties>;

const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

const mapStyleOptions: MapStyleOption[] = [
  { label: 'Light', style: 'mapbox://styles/mapbox/light-v11' },
  { label: 'Streets', style: 'mapbox://styles/mapbox/streets-v12' },
  { label: 'Satellite', style: 'mapbox://styles/mapbox/satellite-streets-v12' },
  { label: 'Dark', style: 'mapbox://styles/mapbox/dark-v11' },
];

const defaultMapStyle = 'mapbox://styles/mapbox/satellite-streets-v12';
const defaultMapCenter: [number, number] = [54.3773, 24.4539];
const defaultFocusArea: FocusArea = 'ADM';
const parksSourceId = 'parks-source';
const parksGlowLayerId = 'parks-glow-layer';
const parksCirclesLayerId = 'parks-circles-layer';
const smartParksRingLayerId = 'smart-parks-ring-layer';
const emptyFeatureCollection: ParkFeatureCollection = {
  type: 'FeatureCollection',
  features: [],
};
const focusAreas: FocusArea[] = ['All Plotted Parks', 'ADM', 'AAM', 'DRM', 'Smart Parks'];
const focusPadding = { top: 90, bottom: 70, left: 70, right: 70 };

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatOptional(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return String(value);
}

function isValidUaeCoordinate(park: ParkRecord): park is PlottedPark {
  if (park.canPlotOnMap === false) {
    return false;
  }

  return (
    (park.canPlotOnMap === true || park.canPlotOnMap === undefined) &&
    typeof park.latitude === 'number' &&
    typeof park.longitude === 'number' &&
    Number.isFinite(park.latitude) &&
    Number.isFinite(park.longitude) &&
    park.latitude >= 22 &&
    park.latitude <= 26 &&
    park.longitude >= 51 &&
    park.longitude <= 57
  );
}

function isNeedsGisReview(park: ParkRecord): boolean {
  return park.gisValidationStatus === 'Needs Review' || park.gisValidationStatus === 'Suspicious' || validateParkLocation(park).isSuspicious;
}

function markerColorForCctv(status: ParkRecord['hasCctvSystem']): MarkerColor {
  if (status === 'Yes') {
    return 'green';
  }

  if (status === 'No') {
    return 'red';
  }

  return 'gray';
}

function badgeClassForStatus(status: 'Yes' | 'No' | 'Unknown', warningForNo = false): string {
  if (status === 'Yes') {
    return 'popup-badge popup-badge-green';
  }

  if (status === 'No') {
    return warningForNo ? 'popup-badge popup-badge-amber' : 'popup-badge popup-badge-red';
  }

  return 'popup-badge popup-badge-gray';
}

function createPopupRow(label: string, value: string | HTMLElement): HTMLElement {
  const row = document.createElement('div');
  row.className = 'popup-row';

  const labelElement = document.createElement('span');
  labelElement.className = 'popup-row-label';
  labelElement.textContent = label;
  row.appendChild(labelElement);

  if (typeof value === 'string') {
    const valueElement = document.createElement('span');
    valueElement.className = 'popup-row-value';
    valueElement.textContent = value;
    row.appendChild(valueElement);
  } else {
    row.appendChild(value);
  }

  return row;
}

function createStatusBadge(value: ParkRecord['hasCctvSystem'] | ParkRecord['hasMaintenanceContract'], warningForNo = false): HTMLElement {
  const badge = document.createElement('span');
  badge.className = badgeClassForStatus(value, warningForNo);
  badge.textContent = value;
  return badge;
}

function createPopupContent(park: ParkFeatureProperties): HTMLElement {
  const container = document.createElement('div');
  container.className = 'executive-map-popup text-left text-sm';

  const title = document.createElement('h3');
  title.className = 'popup-title';
  title.textContent = park.parkName;
  container.appendChild(title);

  const subtitle = document.createElement('p');
  subtitle.className = 'popup-subtitle';
  subtitle.textContent = `${park.municipality} / ${formatOptional(park.region)}`;
  container.appendChild(subtitle);

  if (park.isSmartPark) {
    const smartBadge = document.createElement('span');
    smartBadge.className = 'popup-smart-badge';
    smartBadge.textContent = 'Confirmed Smart Park';
    container.appendChild(smartBadge);
  }

  if (park.isNeedsGisReview) {
    const warningBadge = document.createElement('span');
    warningBadge.className = 'popup-warning-badge';
    warningBadge.textContent = 'Needs GIS Review';
    container.appendChild(warningBadge);
  }

  const rows = document.createElement('div');
  rows.className = 'popup-rows';
  rows.appendChild(createPopupRow('Marker Type', 'Park'));
  rows.appendChild(createPopupRow('CCTV Status', createStatusBadge(park.hasCctvSystem)));
  rows.appendChild(createPopupRow('Total Cameras', formatNumber(park.totalCameras)));
  rows.appendChild(createPopupRow('Maintenance', createStatusBadge(park.hasMaintenanceContract, true)));
  rows.appendChild(createPopupRow('Smart Park', park.isSmartPark ? createStatusBadge('Yes') : '-'));
  rows.appendChild(createPopupRow('DMT Integration', park.isSmartPark ? 'Integrated' : 'Not confirmed'));
  rows.appendChild(createPopupRow('Camera Setup', 'Standalone'));

  if (park.isSmartPark) {
    rows.appendChild(createPopupRow('Capabilities', formatOptional(park.smartParkCapabilities)));
    rows.appendChild(createPopupRow('AI Visitor Counting', park.aiVisitorCountingAvailable ? 'Yes' : 'No'));
    rows.appendChild(
      createPopupRow(
        'AI Visitor Cameras',
        typeof park.aiVisitorCountingCameraCount === 'number' ? formatNumber(park.aiVisitorCountingCameraCount) : '-',
      ),
    );
    if (park.smartParkNote) {
      rows.appendChild(createPopupRow('Note', park.smartParkNote));
    }
  }

  if (park.isNeedsGisReview) {
    rows.appendChild(createPopupRow('GIS Review Reason', formatOptional(park.gisValidationReason)));
  }

  container.appendChild(rows);
  return container;
}

function buildParkFeatureCollection(parks: PlottedPark[]): ParkFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: parks.map((park) => {
      const needsReview = isNeedsGisReview(park);

      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [park.longitude, park.latitude],
        },
        properties: {
          id: park.id,
          parkName: park.parkName,
          municipality: park.municipality,
          region: formatOptional(park.region),
          parkType: formatOptional(park.parkType),
          hasCctvSystem: park.hasCctvSystem,
          totalCameras: park.totalCameras,
          hasMaintenanceContract: park.hasMaintenanceContract,
          maintenanceCompany: formatOptional(park.maintenanceCompany),
          hasDrawings: park.hasDrawings,
          isSmartPark: park.isSmartPark === true,
          smartParkCapabilities: formatOptional(park.smartParkCapabilities?.join(', ')),
          aiVisitorCountingAvailable: park.aiVisitorCountingAvailable === true,
          aiVisitorCountingCameraCount: park.aiVisitorCountingCameraCount ?? 0,
          smartParkNote: formatOptional(park.smartParkNote),
          dmtIntegrationStatus: park.dmtIntegrationStatus,
          dmtIntegrationScope: formatOptional(park.dmtIntegrationScope),
          gisValidationStatus: formatOptional(park.gisValidationStatus),
          gisValidationReason: formatOptional(park.gisValidationReason),
          markerColor: needsReview ? 'orange' : markerColorForCctv(park.hasCctvSystem),
          isNeedsGisReview: needsReview,
        },
      };
    }),
  };
}

function getMarkerColorExpression(): mapboxgl.Expression {
  return [
    'match',
    ['get', 'markerColor'],
    'green',
    '#34d399',
    'red',
    '#ef4444',
    'orange',
    '#fb923c',
    'gray',
    '#94a3b8',
    '#94a3b8',
  ];
}

function addOrUpdateParkLayers(map: mapboxgl.Map, data: ParkFeatureCollection, showSmartParkIndicators: boolean) {
  const source = map.getSource(parksSourceId);

  if (source) {
    (source as mapboxgl.GeoJSONSource).setData(data);
  } else {
    map.addSource(parksSourceId, {
      type: 'geojson',
      data,
    });
  }

  if (!map.getLayer(parksGlowLayerId)) {
    map.addLayer({
      id: parksGlowLayerId,
      type: 'circle',
      source: parksSourceId,
      paint: {
        'circle-radius': 16,
        'circle-color': getMarkerColorExpression(),
        'circle-opacity': 0.25,
        'circle-stroke-width': 0,
      },
    });
  }

  if (!map.getLayer(smartParksRingLayerId)) {
    map.addLayer({
      id: smartParksRingLayerId,
      type: 'circle',
      source: parksSourceId,
      filter: ['==', ['get', 'isSmartPark'], true],
      paint: {
        'circle-radius': 12,
        'circle-color': 'rgba(0, 0, 0, 0)',
        'circle-opacity': 0,
        'circle-stroke-color': '#a78bfa',
        'circle-stroke-opacity': 0.95,
        'circle-stroke-width': 2.5,
      },
    });
  }

  if (!map.getLayer(parksCirclesLayerId)) {
    map.addLayer({
      id: parksCirclesLayerId,
      type: 'circle',
      source: parksSourceId,
      paint: {
        'circle-radius': 7.5,
        'circle-color': getMarkerColorExpression(),
        'circle-opacity': 0.98,
        'circle-stroke-color': '#020617',
        'circle-stroke-width': 1.5,
      },
    });
  }

  if (map.getLayer(smartParksRingLayerId)) {
    map.setLayoutProperty(smartParksRingLayerId, 'visibility', showSmartParkIndicators ? 'visible' : 'none');
  }
}

export default function ExecutiveMapboxMap({ parks }: ExecutiveMapboxMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const parkDataRef = useRef<ParkFeatureCollection>(emptyFeatureCollection);
  const showSmartParkIndicatorsRef = useRef(true);
  const [activeStyle, setActiveStyle] = useState(defaultMapStyle);
  const [showSuspiciousCoordinates, setShowSuspiciousCoordinates] = useState(false);
  const [showSmartParkIndicators, setShowSmartParkIndicators] = useState(true);
  const [showParksWithCctv, setShowParksWithCctv] = useState(true);
  const [showParksWithoutCctv, setShowParksWithoutCctv] = useState(true);
  const [showUnknownCctv, setShowUnknownCctv] = useState(true);
  const [focusArea, setFocusArea] = useState<FocusArea>(defaultFocusArea);
  const [isStyleMenuOpen, setIsStyleMenuOpen] = useState(false);
  const [isLegendOpen, setIsLegendOpen] = useState(false);

  const mapReadyParks = useMemo(() => parks.filter(isValidUaeCoordinate), [parks]);
  const needsReviewCount = useMemo(() => mapReadyParks.filter(isNeedsGisReview).length, [mapReadyParks]);
  const plottedParks = useMemo(
    () =>
      mapReadyParks.filter((park) => {
        if (!showSuspiciousCoordinates && isNeedsGisReview(park)) {
          return false;
        }

        if (park.hasCctvSystem === 'Yes') {
          return showParksWithCctv;
        }

        if (park.hasCctvSystem === 'No') {
          return showParksWithoutCctv;
        }

        return showUnknownCctv;
      }),
    [mapReadyParks, showParksWithCctv, showParksWithoutCctv, showSuspiciousCoordinates, showUnknownCctv],
  );
  const parkFeatureCollection = useMemo(() => buildParkFeatureCollection(plottedParks), [plottedParks]);

  function fitToParks(parksToFit: PlottedPark[], duration = 700) {
    const map = mapRef.current;

    if (!map || parksToFit.length === 0) {
      console.warn('No visible park markers are available for the selected map focus.');
      return;
    }

    const bounds = new mapboxgl.LngLatBounds();
    parksToFit.forEach((park) => bounds.extend([park.longitude, park.latitude]));
    map.fitBounds(bounds, { padding: focusPadding, maxZoom: 12.5, duration });
  }

  function getParksForFocus(area: FocusArea): PlottedPark[] {
    if (area === 'Smart Parks') {
      return plottedParks.filter((park) => park.isSmartPark);
    }

    if (area === 'ADM' || area === 'AAM' || area === 'DRM') {
      return plottedParks.filter((park) => park.municipality === area);
    }

    return plottedParks;
  }

  function fitToPlottedParks() {
    fitToParks(plottedParks);
  }

  function resetView() {
    const admParks = getParksForFocus(defaultFocusArea);

    if (admParks.length > 0) {
      setFocusArea(defaultFocusArea);
      fitToParks(admParks);
      return;
    }

    fitToParks(plottedParks);
  }

  function handleFocusAreaChange(area: FocusArea) {
    setFocusArea(area);
    fitToParks(getParksForFocus(area));
  }

  function changeMapStyle(style: string) {
    const map = mapRef.current;
    setIsStyleMenuOpen(false);

    if (activeStyle === style) {
      return;
    }

    setActiveStyle(style);

    if (!map) {
      return;
    }

    const center = map.getCenter();
    const zoom = map.getZoom();
    const bearing = map.getBearing();
    const pitch = map.getPitch();
    map.setStyle(style);
    map.once('style.load', () => {
      map.jumpTo({ center, zoom, bearing, pitch });
      addOrUpdateParkLayers(map, parkDataRef.current, showSmartParkIndicatorsRef.current);
      map.resize();
    });
  }

  useEffect(() => {
    if (!mapboxToken || !mapContainerRef.current || mapRef.current) {
      return;
    }

    mapboxgl.accessToken = mapboxToken;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: defaultMapStyle,
      center: defaultMapCenter,
      zoom: 8.5,
      attributionControl: false,
    });
    mapRef.current = map;

    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');
    map.on('error', (event) => {
      console.error('Mapbox failed to load:', event.error);
    });
    map.on('load', () => {
      addOrUpdateParkLayers(map, parkDataRef.current, showSmartParkIndicatorsRef.current);
      map.resize();

      map.on('click', parksCirclesLayerId, (event) => {
        const feature = event.features?.[0];

        if (!feature || feature.geometry.type !== 'Point') {
          return;
        }

        const coordinates = feature.geometry.coordinates as [number, number];
        const properties = feature.properties as ParkFeatureProperties | undefined;

        if (!properties) {
          return;
        }

        popupRef.current?.remove();
        popupRef.current = new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: true,
          maxWidth: '300px',
          offset: 14,
        })
          .setLngLat(coordinates)
          .setDOMContent(createPopupContent(properties))
          .addTo(map);
      });

      map.on('mouseenter', parksCirclesLayerId, () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', parksCirclesLayerId, () => {
        map.getCanvas().style.cursor = '';
      });
    });

    map.resize();
    const resizeTimeout = window.setTimeout(() => map.resize(), 200);
    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(mapContainerRef.current);

    const handleWindowResize = () => map.resize();
    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleWindowResize);
      resizeObserver.disconnect();
      popupRef.current?.remove();
      popupRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    parkDataRef.current = parkFeatureCollection;
    showSmartParkIndicatorsRef.current = showSmartParkIndicators;

    const map = mapRef.current;

    if (!map || !map.isStyleLoaded()) {
      return;
    }

    addOrUpdateParkLayers(map, parkFeatureCollection, showSmartParkIndicators);

    if (plottedParks.length > 0) {
      map.resize();
      fitToParks(getParksForFocus(defaultFocusArea).length > 0 ? getParksForFocus(defaultFocusArea) : plottedParks, 0);
    }
  }, [parkFeatureCollection, plottedParks, showSmartParkIndicators]);

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/75 shadow-xl shadow-black/20">
      <div className="relative h-[480px] overflow-hidden bg-slate-950 lg:h-[720px] xl:h-[820px]">
        {mapboxToken ? (
          <div ref={mapContainerRef} className="executive-map-canvas h-full min-h-[480px] w-full lg:min-h-[720px] xl:min-h-[820px]" />
        ) : (
          <div className="flex h-full min-h-[480px] items-center justify-center p-8 text-center lg:min-h-[720px] xl:min-h-[820px]">
            <div className="max-w-xl rounded-2xl border border-amber-300/25 bg-amber-300/10 p-6 text-amber-50">
              <h3 className="text-lg font-semibold">Mapbox token is missing</h3>
              <p className="mt-2 text-sm leading-7">
                Mapbox token is missing. Please add VITE_MAPBOX_TOKEN to the .env file.
              </p>
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-slate-200 shadow-lg shadow-black/25 backdrop-blur">
          <span className="font-semibold text-white">{formatNumber(plottedParks.length)}</span> plotted
          {needsReviewCount > 0 && (
            <span className="ml-2 text-orange-200">• {formatNumber(needsReviewCount)} need GIS review</span>
          )}
        </div>

        <div className="absolute right-4 top-4 z-20 flex flex-col gap-2">
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-slate-950/85 text-slate-200 shadow-lg shadow-black/25 backdrop-blur transition hover:border-cyan-300/40 hover:text-white"
            type="button"
            onClick={fitToPlottedParks}
            title="Fit to parks"
            aria-label="Fit to parks"
          >
            <LocateFixed className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-slate-950/85 text-slate-200 shadow-lg shadow-black/25 backdrop-blur transition hover:border-cyan-300/40 hover:text-white"
            type="button"
            onClick={resetView}
            title="Reset view"
            aria-label="Reset view"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          </button>

          <div className="relative">
            <button
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-slate-950/85 text-slate-200 shadow-lg shadow-black/25 backdrop-blur transition hover:border-cyan-300/40 hover:text-white"
              type="button"
              onClick={() => setIsStyleMenuOpen((current) => !current)}
              title="Map Options"
              aria-label="Map Options"
              aria-expanded={isStyleMenuOpen}
            >
              <Layers className="h-4 w-4" aria-hidden="true" />
              {showSuspiciousCoordinates && needsReviewCount > 0 && (
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border border-slate-950 bg-orange-400" />
              )}
            </button>

            {isStyleMenuOpen && (
              <div className="absolute right-0 top-11 z-30 w-56 rounded-lg border border-white/10 bg-slate-950/90 p-2 shadow-xl shadow-black/30 backdrop-blur">
                <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Map Style</p>
                {mapStyleOptions.map((option) => (
                  <button
                    key={option.label}
                    className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[11px] font-semibold transition ${
                      activeStyle === option.style
                        ? 'bg-cyan-300/20 text-cyan-50'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                    type="button"
                    onClick={() => changeMapStyle(option.style)}
                    title={`Switch to ${option.label} map style`}
                    aria-label={`Switch to ${option.label} map style`}
                  >
                    {option.label}
                    {activeStyle === option.style && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                  </button>
                ))}
                <div className="my-2 border-t border-white/10" />
                <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Map Display</p>
                {[
                  {
                    label: 'Parks with CCTV',
                    checked: showParksWithCctv,
                    onChange: setShowParksWithCctv,
                  },
                  {
                    label: 'Parks without CCTV',
                    checked: showParksWithoutCctv,
                    onChange: setShowParksWithoutCctv,
                  },
                  {
                    label: 'Unknown CCTV status',
                    checked: showUnknownCctv,
                    onChange: setShowUnknownCctv,
                  },
                  {
                    label: 'Confirmed Smart Parks',
                    checked: showSmartParkIndicators,
                    onChange: setShowSmartParkIndicators,
                  },
                  {
                    label: 'Needs GIS Review',
                    checked: showSuspiciousCoordinates,
                    onChange: setShowSuspiciousCoordinates,
                  },
                ].map((option) => (
                  <label
                    key={option.label}
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-white/10 hover:text-white"
                  >
                    <span>{option.label}</span>
                    <input
                      className="h-3.5 w-3.5 accent-cyan-300"
                      type="checkbox"
                      checked={option.checked}
                      onChange={(event) => option.onChange(event.target.checked)}
                    />
                  </label>
                ))}
                <div className="my-2 border-t border-white/10" />
                <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Focus Area</p>
                <select
                  className="w-full rounded-md border border-white/10 bg-slate-950 px-2 py-1.5 text-[11px] font-semibold text-slate-200 outline-none transition focus:border-cyan-300/50"
                  value={focusArea}
                  onChange={(event) => handleFocusAreaChange(event.target.value as FocusArea)}
                  title="Focus map area"
                  aria-label="Focus map area"
                >
                  {focusAreas.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="absolute bottom-4 left-4 z-10">
          <button
            className="pointer-events-auto inline-flex items-center gap-2 rounded-lg border border-white/10 bg-slate-950/85 px-3 py-2 text-xs font-semibold text-slate-100 shadow-lg shadow-black/25 backdrop-blur transition hover:border-cyan-300/40 hover:text-white"
            type="button"
            onClick={() => setIsLegendOpen((current) => !current)}
            aria-expanded={isLegendOpen}
            aria-label="Toggle map legend"
          >
            <Info className="h-3.5 w-3.5" aria-hidden="true" />
            Legend
          </button>

          {isLegendOpen && (
            <div className="pointer-events-auto mt-2 w-56 rounded-xl border border-white/10 bg-slate-950/90 p-3 text-xs text-slate-300 shadow-xl shadow-black/30 backdrop-blur">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="font-semibold uppercase tracking-wide text-white">Legend</p>
                <button
                  className="rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-slate-400 transition hover:bg-white/10 hover:text-white"
                  type="button"
                  onClick={() => setIsLegendOpen(false)}
                  aria-label="Close map legend"
                >
                  Close
                </button>
              </div>
              <div className="space-y-1.5">
                <p className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                  Green: With CCTV
                </p>
                <p className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-500" />
                  Red: Without CCTV
                </p>
                <p className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-slate-400" />
                  Gray: Unknown
                </p>
                <p className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-orange-400" />
                  Orange: GIS Review
                </p>
                <p className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full border-2 border-violet-300 bg-transparent" />
                  Purple ring: Smart Park
                </p>
              </div>
            </div>
          )}
          </div>
      </div>

      <p className="flex items-center gap-2 border-t border-white/10 bg-slate-950/60 px-4 py-2 text-xs leading-5 text-cyan-50">
        <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Markers represent parks, not individual cameras. Some ADM locations are converted from X/Y for visualization.
      </p>
    </section>
  );
}

import mapboxgl from 'mapbox-gl';
import { Check, Layers, LocateFixed, RotateCcw } from 'lucide-react';
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

const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

const mapStyleOptions: MapStyleOption[] = [
  { label: 'Light', style: 'mapbox://styles/mapbox/light-v11' },
  { label: 'Streets', style: 'mapbox://styles/mapbox/streets-v12' },
  { label: 'Satellite', style: 'mapbox://styles/mapbox/satellite-streets-v12' },
  { label: 'Dark', style: 'mapbox://styles/mapbox/dark-v11' },
];

const defaultMapStyle = 'mapbox://styles/mapbox/light-v11';

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

function markerClassName(color: MarkerColor): string {
  if (color === 'orange') {
    return 'bg-orange-400 shadow-[0_0_0_4px_rgba(251,146,60,0.28),0_0_16px_rgba(251,146,60,0.46)] hover:bg-orange-300';
  }

  if (color === 'green') {
    return 'bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.24),0_0_14px_rgba(52,211,153,0.38)] hover:bg-emerald-300';
  }

  if (color === 'red') {
    return 'bg-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.24),0_0_14px_rgba(239,68,68,0.38)] hover:bg-red-400';
  }

  return 'bg-slate-300 shadow-[0_0_0_4px_rgba(148,163,184,0.24),0_0_14px_rgba(148,163,184,0.34)] hover:bg-slate-100';
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

function createPopupContent(park: PlottedPark): HTMLElement {
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

  if (isNeedsGisReview(park)) {
    const warningBadge = document.createElement('span');
    warningBadge.className = 'popup-warning-badge';
    warningBadge.textContent = 'Needs GIS Review';
    container.appendChild(warningBadge);
  }

  const rows = document.createElement('div');
  rows.className = 'popup-rows';
  rows.appendChild(createPopupRow('CCTV Status', createStatusBadge(park.hasCctvSystem)));
  rows.appendChild(createPopupRow('Total Cameras', formatNumber(park.totalCameras)));
  rows.appendChild(createPopupRow('Maintenance', createStatusBadge(park.hasMaintenanceContract, true)));
  rows.appendChild(createPopupRow('Smart Park', park.isSmartPark ? createStatusBadge('Yes') : '-'));
  rows.appendChild(createPopupRow('DMT Integration', park.isSmartPark ? 'Integrated' : 'Not confirmed'));
  rows.appendChild(createPopupRow('Camera Setup', 'Standalone'));
  rows.appendChild(createPopupRow('Park Type', formatOptional(park.parkType)));
  rows.appendChild(createPopupRow('Maintenance Company', formatOptional(park.maintenanceCompany)));

  if (park.isSmartPark) {
    rows.appendChild(createPopupRow('Capabilities', formatOptional(park.smartParkCapabilities?.join(', '))));
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

  if (isNeedsGisReview(park)) {
    rows.appendChild(createPopupRow('GIS Review Reason', formatOptional(park.gisValidationReason)));
  }

  container.appendChild(rows);
  return container;
}

export default function ExecutiveMapboxMap({ parks }: ExecutiveMapboxMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [activeStyle, setActiveStyle] = useState(defaultMapStyle);
  const [showSuspiciousCoordinates, setShowSuspiciousCoordinates] = useState(false);
  const [showSmartParkIndicators, setShowSmartParkIndicators] = useState(true);
  const [showCctvStatusMarkers, setShowCctvStatusMarkers] = useState(true);
  const [isStyleMenuOpen, setIsStyleMenuOpen] = useState(false);

  const mapReadyParks = useMemo(() => parks.filter(isValidUaeCoordinate), [parks]);
  const needsReviewCount = useMemo(() => mapReadyParks.filter(isNeedsGisReview).length, [mapReadyParks]);
  const plottedParks = useMemo(
    () =>
      showCctvStatusMarkers
        ? mapReadyParks.filter((park) => showSuspiciousCoordinates || !isNeedsGisReview(park))
        : [],
    [mapReadyParks, showCctvStatusMarkers, showSuspiciousCoordinates],
  );

  function fitToPlottedParks() {
    const map = mapRef.current;

    if (!map || plottedParks.length === 0) {
      return;
    }

    const bounds = new mapboxgl.LngLatBounds();
    plottedParks.forEach((park) => bounds.extend([park.longitude, park.latitude]));
    map.fitBounds(bounds, { padding: 72, maxZoom: 12, duration: 700 });
  }

  function resetView() {
    mapRef.current?.flyTo({ center: [54.3773, 24.4539], zoom: 8.5, duration: 700 });
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
    map.once('styledata', () => {
      map.jumpTo({ center, zoom, bearing, pitch });
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
      center: [54.3773, 24.4539],
      zoom: 8.5,
      attributionControl: false,
    });
    mapRef.current = map;

    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');
    map.on('error', (event) => {
      console.error('Mapbox failed to load:', event.error);
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
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    plottedParks.forEach((park) => {
      const markerElement = document.createElement('button');
      markerElement.type = 'button';
      markerElement.className = `relative h-5 w-5 cursor-pointer rounded-full border-2 border-slate-950 transition duration-150 hover:scale-110 ${
        park.isSmartPark && showSmartParkIndicators ? 'ring-2 ring-violet-300 ring-offset-2 ring-offset-slate-950' : ''
      } ${markerClassName(
        isNeedsGisReview(park) ? 'orange' : markerColorForCctv(park.hasCctvSystem),
      )}`;
      markerElement.setAttribute('aria-label', `${park.parkName} marker`);
      markerElement.style.pointerEvents = 'auto';

      if (park.isSmartPark && showSmartParkIndicators) {
        const smartBadge = document.createElement('span');
        smartBadge.className =
          'pointer-events-none absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-slate-950 bg-violet-400 text-[9px] font-black leading-none text-white';
        smartBadge.textContent = '★';
        markerElement.appendChild(smartBadge);
      }

      const popup = new mapboxgl.Popup({
        offset: 24,
        closeButton: true,
        closeOnClick: false,
        closeOnMove: false,
        maxWidth: '300px',
      }).setDOMContent(createPopupContent(park));

      const openPopup = (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        popup.setLngLat([park.longitude, park.latitude]).addTo(map);
      };

      markerElement.addEventListener('pointerdown', (event) => {
        event.stopPropagation();
      });
      markerElement.addEventListener('click', (event) => {
        openPopup(event);
      });

      const marker = new mapboxgl.Marker({ element: markerElement, anchor: 'center' })
        .setLngLat([park.longitude, park.latitude])
        .addTo(map);

      markersRef.current.push(marker);
    });

    if (plottedParks.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      plottedParks.forEach((park) => bounds.extend([park.longitude, park.latitude]));
      map.resize();
      map.fitBounds(bounds, { padding: 72, maxZoom: 12, duration: 0 });
    }
  }, [plottedParks, showSmartParkIndicators]);

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
                    label: 'Show GIS Review Markers',
                    checked: showSuspiciousCoordinates,
                    onChange: setShowSuspiciousCoordinates,
                  },
                  {
                    label: 'Show Smart Park Indicators',
                    checked: showSmartParkIndicators,
                    onChange: setShowSmartParkIndicators,
                  },
                  {
                    label: 'Show CCTV Status Markers',
                    checked: showCctvStatusMarkers,
                    onChange: setShowCctvStatusMarkers,
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
              </div>
            )}
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-4 left-4 z-10 rounded-xl border border-white/10 bg-slate-950/85 p-3 shadow-xl shadow-black/30 backdrop-blur">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white">Legend</p>
          <div className="space-y-1.5 text-xs text-slate-300">
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
              Orange: Needs GIS Review
            </p>
            <p className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full border-2 border-violet-300 bg-transparent" />
              Purple ring: Confirmed Smart Park
            </p>
          </div>
        </div>
      </div>

      <p className="border-t border-white/10 bg-slate-950/60 px-4 py-2.5 text-xs leading-6 text-cyan-50">
        Only parks with valid Latitude/Longitude are plotted. Projected X/Y coordinates are available for some parks,
        but require CRS/EPSG confirmation before safe conversion to Latitude/Longitude.
      </p>
    </section>
  );
}

import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import type { Language } from '../i18n/translations';
import type { ParkRecord } from '../types/park';
import type { MapCctvFilter, MapMunicipalityFilter } from './FiltersBar';

type GisMapProps = {
  parks: ParkRecord[];
  language: Language;
  municipality: MapMunicipalityFilter;
  cctvStatus: MapCctvFilter;
  isLoading?: boolean;
};

type MarkerColor = 'green' | 'red' | 'gray';

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatOptional(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return String(value);
}

function isValidUaeCoordinate(park: ParkRecord): park is ParkRecord & { latitude: number; longitude: number } {
  return (
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

function markerColorForCctv(status: ParkRecord['hasCctvSystem']): MarkerColor {
  if (status === 'Yes') {
    return 'green';
  }

  if (status === 'No') {
    return 'red';
  }

  return 'gray';
}

function markerIcon(color: MarkerColor): L.DivIcon {
  const colors = {
    green: { fill: '#22c55e', ring: 'rgba(34, 197, 94, 0.3)' },
    red: { fill: '#ef4444', ring: 'rgba(239, 68, 68, 0.3)' },
    gray: { fill: '#94a3b8', ring: 'rgba(148, 163, 184, 0.3)' },
  };

  return L.divIcon({
    className: '',
    html: `<span style="display:block;width:18px;height:18px;border-radius:9999px;background:${colors[color].fill};border:3px solid #0f172a;box-shadow:0 0 0 5px ${colors[color].ring};"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  });
}

const mapLabels = {
  ar: {
    title: 'الخريطة الجغرافية للحدائق',
    subtitle: 'يتم عرض الحدائق التي تحتوي على Latitude/Longitude صالحة داخل نطاق دولة الإمارات فقط.',
    totalPlotted: 'الحدائق المعروضة على الخريطة',
    plottedWithCctv: 'معروضة وبها CCTV',
    plottedWithoutCctv: 'معروضة وبدون CCTV',
    plottedUnknownCctv: 'معروضة وحالة CCTV غير مؤكدة',
    notPlotted: 'غير معروضة بسبب GIS',
    greenLegend: 'أخضر: حديقة بها CCTV',
    redLegend: 'أحمر: حديقة بدون CCTV',
    grayLegend: 'رمادي: حالة CCTV غير مؤكدة',
    parkName: 'اسم الحديقة',
    municipality: 'البلدية',
    region: 'المنطقة',
    parkType: 'نوع الحديقة',
    cctvStatus: 'حالة CCTV',
    totalCameras: 'عدد الكاميرات',
    maintenanceContract: 'عقد الصيانة',
    maintenanceCompany: 'شركة الصيانة',
    drawings: 'المخططات',
    dmtIntegration: 'حالة الربط مع DMT',
    dmtValue: 'غير مربوطة',
    cameraSetupType: 'نوع النظام',
    note: 'يتم عرض الحدائق التي تحتوي على إحداثيات Latitude/Longitude صالحة فقط. إحداثيات X/Y تحتاج تأكيد نظام الإحداثيات قبل التحويل.',
  },
  en: {
    title: 'Parks GIS Map',
    subtitle: 'Only parks with valid Latitude/Longitude within the UAE range are displayed.',
    totalPlotted: 'Total plotted parks',
    plottedWithCctv: 'Plotted parks with CCTV',
    plottedWithoutCctv: 'Plotted parks without CCTV',
    plottedUnknownCctv: 'Plotted parks with unknown CCTV status',
    notPlotted: 'Not plotted due to missing/invalid GIS',
    greenLegend: 'Green: Park with CCTV',
    redLegend: 'Red: Park without CCTV',
    grayLegend: 'Grey: CCTV status unknown',
    parkName: 'Park Name',
    municipality: 'Municipality',
    region: 'Region',
    parkType: 'Park Type',
    cctvStatus: 'CCTV Status',
    totalCameras: 'Total Cameras',
    maintenanceContract: 'Maintenance Contract',
    maintenanceCompany: 'Maintenance Company',
    drawings: 'Drawings',
    dmtIntegration: 'DMT Integration',
    dmtValue: 'Not Integrated',
    cameraSetupType: 'Camera Setup Type',
    note: 'Only parks with valid Latitude/Longitude are displayed. X/Y coordinates require coordinate reference system confirmation before conversion.',
  },
} as const;

export default function GisMap({ parks, language, municipality, cctvStatus, isLoading = false }: GisMapProps) {
  const labels = mapLabels[language];
  const filteredParks = parks.filter((park) => {
    return (
      (municipality === 'All' || park.municipality === municipality) &&
      (cctvStatus === 'All' || park.hasCctvSystem === cctvStatus)
    );
  });
  const plottedParks = filteredParks.filter(isValidUaeCoordinate);
  const notPlottedCount = filteredParks.length - plottedParks.length;

  const summaryItems = [
    [labels.totalPlotted, plottedParks.length],
    [labels.plottedWithCctv, plottedParks.filter((park) => park.hasCctvSystem === 'Yes').length],
    [labels.plottedWithoutCctv, plottedParks.filter((park) => park.hasCctvSystem === 'No').length],
    [labels.plottedUnknownCctv, plottedParks.filter((park) => park.hasCctvSystem === 'Unknown').length],
    [labels.notPlotted, notPlottedCount],
  ];

  return (
    <section className="max-w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/20">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-white">{labels.title}</h2>
          <p className="mt-2 break-words text-base leading-7 text-slate-400">
            {labels.subtitle}
          </p>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {summaryItems.map(([label, value]) => (
          <article key={label} className="min-w-0 rounded-xl border border-white/10 bg-slate-950/70 p-4">
            <p className="truncate text-sm text-slate-400" title={String(label)}>
              {label}
            </p>
            <p className="mt-2 text-2xl font-bold text-white">{isLoading ? '-' : formatNumber(Number(value))}</p>
          </article>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-3 rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-green-500" />
          {labels.greenLegend}
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-500" />
          {labels.redLegend}
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-slate-400" />
          {labels.grayLegend}
        </span>
      </div>

      <div className="h-[420px] max-w-full overflow-hidden rounded-xl border border-white/10 bg-slate-950 lg:h-[650px]">
        <MapContainer center={[24.4539, 54.3773]} zoom={9} scrollWheelZoom={false}>
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {plottedParks.map((park) => (
            <Marker
              key={park.id}
              icon={markerIcon(markerColorForCctv(park.hasCctvSystem))}
              position={[park.latitude, park.longitude]}
            >
              <Popup>
                <div
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                  className={`min-w-[260px] text-sm leading-6 text-slate-900 ${language === 'ar' ? 'text-right' : 'text-left'}`}
                >
                  <h3 className="mb-2 text-base font-bold">{park.parkName}</h3>
                  <p>{labels.parkName}: {park.parkName}</p>
                  <p>{labels.municipality}: {park.municipality}</p>
                  <p>{labels.region}: {formatOptional(park.region)}</p>
                  <p>{labels.parkType}: {formatOptional(park.parkType)}</p>
                  <p>{labels.cctvStatus}: {park.hasCctvSystem}</p>
                  <p>{labels.totalCameras}: {formatNumber(park.totalCameras)}</p>
                  <p>{labels.maintenanceContract}: {park.hasMaintenanceContract}</p>
                  <p>{labels.maintenanceCompany}: {formatOptional(park.maintenanceCompany)}</p>
                  <p>{labels.drawings}: {park.hasDrawings}</p>
                  <p>{labels.dmtIntegration}: {labels.dmtValue}</p>
                  <p>{labels.cameraSetupType}: Standalone</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <p className="mt-4 rounded-xl border border-cyan-400/15 bg-cyan-400/10 px-4 py-3 text-sm leading-7 text-cyan-50">
        {labels.note}
      </p>
    </section>
  );
}

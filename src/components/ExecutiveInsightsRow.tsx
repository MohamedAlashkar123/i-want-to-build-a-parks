import { AlertTriangle, Database, MapPinned } from 'lucide-react';
import type { ParkRecord } from '../types/park';
import {
  getParksWithoutCctv,
  getSmartParksCount,
  getSmartParksWithVisitorCountingCount,
  getTotalParks,
  getTotalVisitorCountingCameras,
} from '../utils/dashboardCalculations';

type ExecutiveInsightsRowProps = {
  parks: ParkRecord[];
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export default function ExecutiveInsightsRow({ parks }: ExecutiveInsightsRowProps) {
  const totalParks = getTotalParks(parks);
  const validGis = parks.filter(
    (park) => park.canPlotOnMap && park.gisValidationStatus !== 'Needs Review' && park.gisValidationStatus !== 'Suspicious',
  ).length;
  const googleMaps = parks.filter(
    (park) =>
      park.coordinateSource === 'Google Maps' &&
      park.canPlotOnMap &&
      park.gisValidationStatus !== 'Needs Review' &&
      park.gisValidationStatus !== 'Suspicious',
  ).length;
  const convertedAdmXy = parks.filter((park) => park.coordinateSource === 'Converted ADM X/Y' && park.canPlotOnMap).length;
  const convertedAamXy = parks.filter((park) => park.coordinateSource === 'Converted AAM X/Y' && park.canPlotOnMap).length;
  const convertedDrmXy = parks.filter((park) => park.coordinateSource === 'Converted DRM X/Y' && park.canPlotOnMap).length;
  const projectedXy = parks.filter(
    (park) => park.coordinateSource === 'Projected XY' || park.coordinateConversionStatus === 'Conversion Review Required',
  ).length;
  const missingOrInvalidGis = parks.filter((park) => !park.canPlotOnMap).length;
  const gisPendingOrMissing = projectedXy + missingOrInvalidGis;
  const gisReadyPercent = totalParks === 0 ? 0 : (validGis / totalParks) * 100;
  const coverageRows = [
    ['Parks without CCTV', getParksWithoutCctv(parks)],
    ['GIS pending / missing', gisPendingOrMissing],
    ['Confirmed smart parks', getSmartParksCount(parks)],
    ['AI visitor counting cameras', getTotalVisitorCountingCameras(parks)],
  ];

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/45 p-4 shadow-xl shadow-black/20">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">Executive Summary</h2>
        <p className="mt-1 text-sm text-slate-400">Key operational, GIS, and smart parks indicators for management review.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <article className="flex h-full min-h-[238px] flex-col rounded-2xl border border-white/10 bg-slate-950/55 p-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-200" aria-hidden="true" />
            <h3 className="text-base font-semibold text-white">Coverage & Operational Gaps</h3>
          </div>
          <div className="grid flex-1 grid-cols-1 gap-2">
            {coverageRows.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2">
                <p className="min-w-0 truncate text-xs text-slate-400">{label}</p>
                <p className="shrink-0 text-sm font-bold text-white">{formatNumber(Number(value))}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-semibold leading-5 text-cyan-50">
            CCTV availability is measured at park level, not physical camera coverage.
          </p>
        </article>

        <article className="flex h-full min-h-[238px] flex-col rounded-2xl border border-white/10 bg-slate-950/55 p-4">
          <div className="mb-3 flex items-center gap-2">
            <MapPinned className="h-4 w-4 text-emerald-100" aria-hidden="true" />
            <h3 className="text-base font-semibold text-white">GIS Readiness</h3>
          </div>
          <div className="mb-3 flex items-center justify-between gap-4">
            <span className="text-xs text-slate-400">Ready for map</span>
            <span className="text-sm font-bold text-white">{gisReadyPercent.toFixed(1)}%</span>
          </div>
          <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-900">
            <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.min(100, gisReadyPercent)}%` }} />
          </div>
          <div className="grid flex-1 grid-cols-2 gap-2">
            {[
              ['Ready', validGis],
              ['Google Maps', googleMaps],
              ['ADM X/Y', convertedAdmXy],
              ['AAM X/Y', convertedAamXy],
              ['DRM X/Y', convertedDrmXy],
              ['Pending', projectedXy],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2">
                <p className="truncate text-[11px] text-slate-500">{label}</p>
                <p className="text-base font-bold text-white">{formatNumber(Number(value))}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="flex h-full min-h-[238px] flex-col rounded-2xl border border-white/10 bg-slate-950/55 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Database className="h-4 w-4 text-cyan-100" aria-hidden="true" />
            <h3 className="text-base font-semibold text-white">Data Notes</h3>
          </div>
          <ul className="grid flex-1 list-disc content-start gap-y-2 pl-4 text-xs leading-5 text-slate-300 marker:text-cyan-300">
            <li>Park locations are enriched using the GIS Geodatabase provided by the GIS team.</li>
            <li>CCTV availability and camera counts are based on the CCTV inventory Excel.</li>
            <li>Confirmed smart parks are based on project-team confirmation.</li>
            <li>AI visitor counting data is available for {formatNumber(getSmartParksWithVisitorCountingCount(parks))} of the {formatNumber(getSmartParksCount(parks))} confirmed smart parks.</li>
            <li>Corniche Beach is a confirmed smart park and integrated with DMT systems, but it has no CCTV visitor counting cameras.</li>
            <li>Operational camera status and actual physical camera coverage percentage are not available in the current dataset.</li>
          </ul>
        </article>
      </div>
    </section>
  );
}

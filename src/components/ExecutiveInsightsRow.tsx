import { AlertTriangle, Database, MapPinned } from 'lucide-react';
import type { ParkRecord } from '../types/park';
import {
  getDmtIntegratedSmartParksCount,
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
  const projectedXy = parks.filter(
    (park) => park.coordinateSource === 'Projected XY' || park.coordinateConversionStatus === 'Conversion Review Required',
  ).length;
  const gisReadyPercent = totalParks === 0 ? 0 : (validGis / totalParks) * 100;
  const insights = [
    ['Confirmed smart parks', getSmartParksCount(parks)],
    ['AI visitor counting parks', getSmartParksWithVisitorCountingCount(parks)],
    ['AI visitor counting cameras', getTotalVisitorCountingCameras(parks)],
    ['DMT integrated smart parks', getDmtIntegratedSmartParksCount(parks)],
  ];

  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <article className="rounded-2xl border border-white/10 bg-slate-900/75 p-4 shadow-xl shadow-black/20">
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-200" aria-hidden="true" />
          <h2 className="text-base font-semibold text-white">Executive Insights</h2>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
          {insights.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2">
              <p className="min-w-0 truncate text-xs text-slate-400">{label}</p>
              <p className="shrink-0 text-sm font-bold text-white">{formatNumber(Number(value))}</p>
            </div>
          ))}
        </div>
      </article>

      <article className="rounded-2xl border border-white/10 bg-slate-900/75 p-4 shadow-xl shadow-black/20">
        <div className="mb-3 flex items-center gap-2">
          <MapPinned className="h-4 w-4 text-emerald-100" aria-hidden="true" />
          <h2 className="text-base font-semibold text-white">GIS Readiness</h2>
        </div>
        <div className="mb-2 flex items-center justify-between gap-4">
          <span className="text-xs text-slate-400">Ready for map</span>
          <span className="text-xs font-semibold text-white">{gisReadyPercent.toFixed(1)}%</span>
        </div>
        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-slate-950">
          <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.min(100, gisReadyPercent)}%` }} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            ['Valid GIS', validGis],
            ['Google Maps', googleMaps],
            ['Converted ADM X/Y', convertedAdmXy],
            ['X/Y Pending', projectedXy],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-slate-950/60 px-3 py-2">
              <p className="truncate text-[11px] text-slate-500">{label}</p>
              <p className="text-sm font-bold text-white">{formatNumber(Number(value))}</p>
            </div>
          ))}
        </div>
      </article>

      <article className="rounded-2xl border border-white/10 bg-slate-900/75 p-4 shadow-xl shadow-black/20">
        <div className="mb-3 flex items-center gap-2">
          <Database className="h-4 w-4 text-cyan-100" aria-hidden="true" />
          <h2 className="text-base font-semibold text-white">Data Availability</h2>
        </div>
        <ul className="grid list-disc gap-y-1.5 pl-4 text-xs leading-5 text-slate-300 marker:text-cyan-300">
          <li>Confirmed smart parks use project-team confirmation and provided coordinates.</li>
          <li>AI visitor counting data is available for 5 of 6 confirmed smart parks.</li>
          <li>ADM X/Y coordinates are converted for map visualization using UTM Zone 40N.</li>
          <li>No operational camera status or actual coverage percentage is available.</li>
        </ul>
      </article>
    </section>
  );
}

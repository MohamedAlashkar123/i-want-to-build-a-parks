import { AlertTriangle, MapPinned } from 'lucide-react';
import type { ParkRecord } from '../types/park';
import {
  getDmtIntegratedSmartParksCount,
  getSmartParksCount,
  getSmartParksWithVisitorCountingCount,
  getTotalParks,
  getTotalVisitorCountingCameras,
} from '../utils/dashboardCalculations';

type ExecutiveSidePanelProps = {
  parks: ParkRecord[];
};

export default function ExecutiveSidePanel({ parks }: ExecutiveSidePanelProps) {
  const totalParks = getTotalParks(parks);
  const needsGisReview = parks.filter((park) => park.gisValidationStatus === 'Needs Review' || park.gisValidationStatus === 'Suspicious').length;
  const validGis = parks.filter((park) => park.canPlotOnMap && park.gisValidationStatus !== 'Needs Review' && park.gisValidationStatus !== 'Suspicious').length;
  const googleMaps = parks.filter(
    (park) => park.coordinateSource === 'Google Maps' && park.canPlotOnMap && park.gisValidationStatus !== 'Needs Review' && park.gisValidationStatus !== 'Suspicious',
  ).length;
  const projectedXy = parks.filter((park) => park.coordinateSource === 'Projected XY').length;
  const gisReadyPercent = totalParks === 0 ? 0 : (validGis / totalParks) * 100;
  const insights = [
    ['Confirmed smart parks', getSmartParksCount(parks)],
    ['AI visitor counting parks', getSmartParksWithVisitorCountingCount(parks)],
    ['AI visitor counting cameras', getTotalVisitorCountingCameras(parks)],
    ['DMT integrated smart parks', getDmtIntegratedSmartParksCount(parks)],
  ];

  return (
    <aside>
      <section className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/75 p-4 shadow-xl shadow-black/20">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-200" aria-hidden="true" />
            <h2 className="text-base font-semibold text-white">Executive Insights</h2>
          </div>
          <div className="space-y-1.5">
            {insights.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2">
                <p className="min-w-0 truncate text-xs text-slate-400">{label}</p>
                <p className="shrink-0 text-sm font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-semibold leading-5 text-cyan-50">
            Confirmed smart parks are integrated with DMT systems. Integration status for remaining CCTV inventory parks is not confirmed in the current dataset.
          </p>
        </div>

        <div className="border-t border-white/10 pt-4">
          <div className="mb-3 flex items-center gap-2">
            <MapPinned className="h-4 w-4 text-emerald-100" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-white">GIS Readiness</h3>
          </div>
          <div className="mb-2 flex items-center justify-between gap-4">
            <span className="text-xs text-slate-400">Ready for map</span>
            <span className="text-xs font-semibold text-white">{gisReadyPercent.toFixed(1)}%</span>
          </div>
          <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-slate-950">
            <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.min(100, gisReadyPercent)}%` }} />
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              ['Valid GIS', validGis],
              ['Google Maps', googleMaps],
              ['GIS Review', needsGisReview],
              ['X/Y Pending', projectedXy],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-slate-950/60 px-3 py-2">
                <p className="truncate text-[11px] text-slate-500">{label}</p>
                <p className="text-sm font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>

      </section>
    </aside>
  );
}

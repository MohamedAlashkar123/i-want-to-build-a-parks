import { Database } from 'lucide-react';
import type { ParkRecord } from '../types/park';

type ExecutiveSidePanelProps = {
  parks: ParkRecord[];
};

export default function ExecutiveSidePanel({ parks }: ExecutiveSidePanelProps) {
  const needsGisReview = parks.filter((park) => park.gisValidationStatus === 'Needs Review' || park.gisValidationStatus === 'Suspicious').length;
  const projectedXy = parks.filter((park) => park.coordinateSource === 'Projected XY').length;

  return (
    <aside>
      <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-4 shadow-xl shadow-black/20">
        <div className="mb-3 flex items-center gap-2">
          <Database className="h-4 w-4 text-cyan-100" aria-hidden="true" />
          <h2 className="text-base font-semibold text-white">Data Availability</h2>
        </div>
        <div className="mb-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2">
            <p className="text-[11px] text-slate-500">GIS review</p>
            <p className="text-lg font-bold text-white">{needsGisReview}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2">
            <p className="text-[11px] text-slate-500">X/Y pending</p>
            <p className="text-lg font-bold text-white">{projectedXy}</p>
          </div>
        </div>
        <ul className="list-disc space-y-1.5 pl-4 text-xs leading-5 text-slate-300 marker:text-cyan-300">
          <li>No AI analytics or advanced video analytics in the current dataset.</li>
          <li>No IoT asset-level detail beyond the confirmed smart park list.</li>
          <li>No operational camera status or actual coverage percentage.</li>
          <li>X/Y coordinates require CRS/EPSG confirmation.</li>
          <li>Some coordinates were excluded from the map because they fall outside the expected municipality area and require GIS validation.</li>
          <li>English park names are missing from the current dataset.</li>
        </ul>
      </section>
    </aside>
  );
}

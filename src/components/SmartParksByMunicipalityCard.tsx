import { Cpu } from 'lucide-react';
import { confirmedSmartParks } from '../data/confirmedSmartParks';
import type { ParkRecord } from '../types/park';
import {
  getSmartParksByMunicipality,
  getSmartParksCount,
  getSmartParksWithVisitorCountingCount,
  getSmartParksWithoutVisitorCountingCctvCount,
  getTotalVisitorCountingCameras,
} from '../utils/dashboardCalculations';

type SmartParksByMunicipalityCardProps = {
  parks: ParkRecord[];
  isLoading?: boolean;
  compact?: boolean;
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export default function SmartParksByMunicipalityCard({ parks, isLoading = false, compact = false }: SmartParksByMunicipalityCardProps) {
  const rows = getSmartParksByMunicipality(parks);
  const total = getSmartParksCount(parks);
  const visitorCountingParks = getSmartParksWithVisitorCountingCount(parks);
  const visitorCountingCameras = getTotalVisitorCountingCameras(parks);
  const withoutAiVisitorCounting = getSmartParksWithoutVisitorCountingCctvCount(parks);
  const maxValue = Math.max(1, ...rows.map((row) => row.smartParks));

  return (
    <section className="h-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900/75 p-4 shadow-xl shadow-black/20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white">Smart Parks & AI Visitor Counting</h2>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            AI visitor counting CCTV capability based on project-team input.
          </p>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-300/20 bg-violet-300/10 text-violet-100">
          <Cpu className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>

      <div className={`mt-4 grid gap-3 ${compact ? '' : 'lg:grid-cols-[160px_minmax(0,1fr)] lg:items-center'}`}>
        <div className="rounded-xl border border-violet-300/20 bg-violet-300/10 p-3">
          <p className="text-xs text-violet-100">Confirmed Smart Parks</p>
          <p className="mt-1 text-3xl font-bold text-white">{isLoading ? '-' : formatNumber(total)}</p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {[
            ['With AI Visitor Counting', visitorCountingParks],
            ['Without AI Visitor Counting', withoutAiVisitorCounting],
            ['AI Visitor Cameras', visitorCountingCameras],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
              <p className="truncate text-xs text-slate-500">{label}</p>
              <p className="mt-1 text-xl font-bold text-white">{isLoading ? '-' : formatNumber(Number(value))}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.municipality} className="grid grid-cols-[48px_minmax(0,1fr)_32px] items-center gap-3 text-xs">
              <span className="font-semibold text-slate-300">{row.municipality}</span>
              <div className="h-2 overflow-hidden rounded-full bg-slate-950">
                <div
                  className="h-full rounded-full bg-violet-400"
                  style={{ width: `${(row.smartParks / maxValue) * 100}%` }}
                />
              </div>
              <span className="text-right font-bold text-white">{isLoading ? '-' : formatNumber(row.smartParks)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 max-w-full overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[760px] border-collapse text-left text-xs">
          <thead className="bg-slate-950 text-slate-300">
            <tr>
              <th className="whitespace-nowrap px-3 py-2 font-semibold">Smart Park</th>
              <th className="whitespace-nowrap px-3 py-2 font-semibold">Municipality</th>
              <th className="whitespace-nowrap px-3 py-2 font-semibold">DMT Integration</th>
              <th className="whitespace-nowrap px-3 py-2 font-semibold">AI Visitor Counting</th>
              <th className="whitespace-nowrap px-3 py-2 font-semibold">AI Visitor Counting Cameras</th>
              <th className="whitespace-nowrap px-3 py-2 font-semibold">Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 bg-slate-950/50">
            {confirmedSmartParks.map((smartPark) => (
              <tr key={`${smartPark.municipality}-${smartPark.smartParkNameEn}`} className="hover:bg-white/[0.03]">
                <td className="whitespace-nowrap px-3 py-2 font-semibold text-white">{smartPark.smartParkNameEn}</td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-300">{smartPark.municipality}</td>
                <td className="whitespace-nowrap px-3 py-2 text-emerald-100">{smartPark.dmtIntegrationStatus}</td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-100">
                  {smartPark.aiVisitorCountingAvailable ? 'Yes' : 'No'}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-100">
                  {formatNumber(smartPark.aiVisitorCountingCameraCount)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-400">{smartPark.smartParkNote || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!compact && (
        <p className="mt-4 rounded-xl border border-cyan-300/15 bg-cyan-300/10 px-3 py-2 text-xs leading-5 text-cyan-50">
          Smart Park classification is based on the confirmed list provided by the project team, not inferred from the
          Excel inventory.
        </p>
      )}
    </section>
  );
}

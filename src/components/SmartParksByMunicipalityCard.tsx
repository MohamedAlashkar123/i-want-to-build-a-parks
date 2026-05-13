import { Cpu } from 'lucide-react';
import type { ParkRecord } from '../types/park';
import { getSmartParksByMunicipality, getSmartParksCount } from '../utils/dashboardCalculations';

type SmartParksByMunicipalityCardProps = {
  parks: ParkRecord[];
  isLoading?: boolean;
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export default function SmartParksByMunicipalityCard({ parks, isLoading = false }: SmartParksByMunicipalityCardProps) {
  const rows = getSmartParksByMunicipality(parks);
  const total = getSmartParksCount(parks);
  const maxValue = Math.max(1, ...rows.map((row) => row.smartParks));

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/75 p-4 shadow-xl shadow-black/20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white">Smart Parks by Municipality</h2>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            Confirmed smart parks with cameras, sensors, and smart sensor management.
          </p>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-300/20 bg-violet-300/10 text-violet-100">
          <Cpu className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[160px_minmax(0,1fr)] lg:items-center">
        <div className="rounded-xl border border-violet-300/20 bg-violet-300/10 p-3">
          <p className="text-xs text-violet-100">Confirmed Smart Parks</p>
          <p className="mt-1 text-3xl font-bold text-white">{isLoading ? '-' : formatNumber(total)}</p>
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

      <p className="mt-4 rounded-xl border border-cyan-300/15 bg-cyan-300/10 px-3 py-2 text-xs leading-5 text-cyan-50">
        Smart Park classification is based on the confirmed list provided by the project team, not inferred from the
        Excel inventory.
      </p>
    </section>
  );
}

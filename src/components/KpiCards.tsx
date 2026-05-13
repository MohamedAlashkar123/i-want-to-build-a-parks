import { Camera, Cpu, Link2Off, MapPinned, Percent, Trees } from 'lucide-react';
import type { ParkRecord } from '../types/park';
import {
  getCctvParkPercentage,
  getDmtIntegratedParks,
  getParksWithCctv,
  getParksWithoutCctv,
  getSmartParksCount,
  getTotalCameras,
  getTotalParks,
} from '../utils/dashboardCalculations';

type KpiCardsProps = {
  parks: ParkRecord[];
  isLoading?: boolean;
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatPercentage(value: number): string {
  const rounded = Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
  return `${rounded}%`;
}

export default function KpiCards({ parks, isLoading = false }: KpiCardsProps) {
  const kpis = [
    {
      label: 'Total Parks',
      value: formatNumber(getTotalParks(parks)),
      icon: Trees,
    },
    {
      label: 'With CCTV',
      value: formatNumber(getParksWithCctv(parks)),
      icon: Camera,
    },
    {
      label: 'Without CCTV',
      value: formatNumber(getParksWithoutCctv(parks)),
      icon: Camera,
    },
    {
      label: 'Cameras',
      value: formatNumber(getTotalCameras(parks)),
      icon: MapPinned,
    },
    {
      label: 'CCTV %',
      value: formatPercentage(getCctvParkPercentage(parks)),
      icon: Percent,
    },
    {
      label: 'DMT Integration',
      value: formatNumber(getDmtIntegratedParks(parks)),
      icon: Link2Off,
    },
    {
      label: 'Smart Parks',
      value: formatNumber(getSmartParksCount(parks)),
      icon: Cpu,
    },
  ];

  return (
    <section className="grid max-w-full grid-cols-2 gap-3 md:grid-cols-4 2xl:grid-cols-7">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;

        return (
          <article
            key={kpi.label}
            className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-slate-900/75 p-3 shadow-xl shadow-black/20"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-400">{kpi.label}</p>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan-300/15 bg-cyan-300/10 text-cyan-100">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-1 truncate text-2xl font-bold text-white">{isLoading ? '-' : kpi.value}</p>
          </article>
        );
      })}
    </section>
  );
}

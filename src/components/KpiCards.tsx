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
      helper: 'Unified Excel records',
      icon: Trees,
    },
    {
      label: 'Parks with CCTV',
      value: formatNumber(getParksWithCctv(parks)),
      helper: 'CCTV status = Yes',
      icon: Camera,
    },
    {
      label: 'Parks without CCTV',
      value: formatNumber(getParksWithoutCctv(parks)),
      helper: 'CCTV status = No',
      icon: Camera,
    },
    {
      label: 'Total Cameras',
      value: formatNumber(getTotalCameras(parks)),
      helper: 'Recorded camera count',
      icon: MapPinned,
    },
    {
      label: 'Parks with CCTV %',
      value: formatPercentage(getCctvParkPercentage(parks)),
      helper: 'Not actual camera coverage',
      icon: Percent,
    },
    {
      label: 'DMT Integration',
      value: formatNumber(getDmtIntegratedParks(parks)),
      helper: 'Current status: not integrated',
      icon: Link2Off,
    },
    {
      label: 'Confirmed Smart Parks',
      value: formatNumber(getSmartParksCount(parks)),
      helper: 'Confirmed project-team list',
      icon: Cpu,
    },
  ];

  return (
    <section className="grid max-w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;

        return (
          <article
            key={kpi.label}
            className="min-h-28 min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/75 p-4 shadow-xl shadow-black/20"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="line-clamp-2 text-sm font-semibold leading-5 text-slate-300">{kpi.label}</p>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-100">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 truncate text-3xl font-bold text-white">{isLoading ? '-' : kpi.value}</p>
            <p className="mt-2 truncate text-xs text-slate-500" title={kpi.helper}>
              {kpi.helper}
            </p>
          </article>
        );
      })}
    </section>
  );
}

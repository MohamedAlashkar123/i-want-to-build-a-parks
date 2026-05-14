import { Bot, Camera, Cpu, Link, MapPinned, Percent, Trees, type LucideIcon } from 'lucide-react';
import type { ParkRecord } from '../types/park';
import {
  getCctvParkPercentage,
  getDmtIntegratedSmartParksCount,
  getParksWithCctv,
  getParksWithoutCctv,
  getSmartParksCount,
  getSmartParksWithVisitorCountingCount,
  getTotalCameras,
  getTotalParks,
  getTotalVisitorCountingCameras,
} from '../utils/dashboardCalculations';

type KpiCardsProps = {
  parks: ParkRecord[];
  isLoading?: boolean;
};

type KpiItem = {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatPercentage(value: number): string {
  const rounded = Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
  return `${rounded}%`;
}

export default function KpiCards({ parks, isLoading = false }: KpiCardsProps) {
  const primaryKpis = [
    {
      label: 'Total Parks',
      value: formatNumber(getTotalParks(parks)),
      helper: 'Unified inventory records',
      icon: Trees,
    },
    {
      label: 'With CCTV',
      value: formatNumber(getParksWithCctv(parks)),
      helper: 'CCTV status = Yes',
      icon: Camera,
    },
    {
      label: 'Without CCTV',
      value: formatNumber(getParksWithoutCctv(parks)),
      helper: 'CCTV status = No',
      icon: Camera,
    },
    {
      label: 'Cameras',
      value: formatNumber(getTotalCameras(parks)),
      helper: 'Recorded camera count',
      icon: MapPinned,
    },
    {
      label: 'CCTV Availability',
      value: formatPercentage(getCctvParkPercentage(parks)),
      helper: 'Park-level, not physical coverage',
      icon: Percent,
    },
  ];

  const smartParkKpis = [
    {
      label: 'Smart Parks',
      value: formatNumber(getSmartParksCount(parks)),
      helper: 'Confirmed project list',
      icon: Cpu,
    },
    {
      label: 'AI Counting Parks',
      value: formatNumber(getSmartParksWithVisitorCountingCount(parks)),
      helper: '5 of 6 smart parks',
      icon: Bot,
    },
    {
      label: 'AI Counting Cameras',
      value: formatNumber(getTotalVisitorCountingCameras(parks)),
      helper: 'Visitor counting CCTV cams',
      icon: Camera,
    },
    {
      label: 'DMT Integrated',
      value: formatNumber(getDmtIntegratedSmartParksCount(parks)),
      helper: 'Confirmed smart parks',
      icon: Link,
    },
  ];

  function renderCard(kpi: KpiItem) {
    const Icon = kpi.icon;

    return (
      <article
        key={kpi.label}
        className="grid h-[124px] min-w-0 grid-rows-[34px_1fr_24px] overflow-hidden rounded-xl border border-white/10 bg-slate-950/55 p-3"
      >
        <div className="flex min-w-0 items-start justify-between gap-2">
          <p className="min-w-0 truncate text-xs font-semibold leading-4 text-slate-300" title={kpi.label}>
            {kpi.label}
          </p>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-cyan-300/15 bg-cyan-300/10 text-cyan-100">
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </div>
        <p className="flex items-center truncate text-3xl font-bold leading-none text-white">{isLoading ? '-' : kpi.value}</p>
        <p className="line-clamp-2 text-[11px] leading-3 text-slate-500">{kpi.helper}</p>
      </article>
    );
  }

  return (
    <section className="grid max-w-full grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
      <div className="rounded-2xl border border-white/10 bg-slate-900/75 p-3.5 shadow-xl shadow-black/20">
        <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Primary CCTV KPIs</h2>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-5">{primaryKpis.map(renderCard)}</div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/75 p-3.5 shadow-xl shadow-black/20">
        <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Smart Parks KPIs</h2>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">{smartParkKpis.map(renderCard)}</div>
      </div>
    </section>
  );
}

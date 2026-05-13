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
      icon: Trees,
    },
    {
      label: 'Parks with CCTV',
      value: formatNumber(getParksWithCctv(parks)),
      icon: Camera,
    },
    {
      label: 'Parks without CCTV',
      value: formatNumber(getParksWithoutCctv(parks)),
      icon: Camera,
    },
    {
      label: 'Total Cameras',
      value: formatNumber(getTotalCameras(parks)),
      icon: MapPinned,
    },
    {
      label: 'CCTV Availability %',
      value: formatPercentage(getCctvParkPercentage(parks)),
      icon: Percent,
    },
  ];

  const smartParkKpis = [
    {
      label: 'Confirmed Smart Parks',
      value: formatNumber(getSmartParksCount(parks)),
      icon: Cpu,
    },
    {
      label: 'AI Visitor Counting Parks',
      value: formatNumber(getSmartParksWithVisitorCountingCount(parks)),
      icon: Bot,
    },
    {
      label: 'AI Visitor Counting Cameras',
      value: formatNumber(getTotalVisitorCountingCameras(parks)),
      icon: Camera,
    },
    {
      label: 'DMT Integrated Smart Parks',
      value: formatNumber(getDmtIntegratedSmartParksCount(parks)),
      icon: Link,
    },
  ];

  function renderCard(kpi: KpiItem) {
    const Icon = kpi.icon;

    return (
      <article
        key={kpi.label}
        className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-slate-950/55 p-3"
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-semibold leading-4 text-slate-400">{kpi.label}</p>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan-300/15 bg-cyan-300/10 text-cyan-100">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
        <p className="mt-2 truncate text-2xl font-bold text-white">{isLoading ? '-' : kpi.value}</p>
      </article>
    );
  }

  return (
    <section className="grid max-w-full grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
      <div className="rounded-2xl border border-white/10 bg-slate-900/75 p-4 shadow-xl shadow-black/20">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-300">Primary CCTV KPIs</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-5">{primaryKpis.map(renderCard)}</div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/75 p-4 shadow-xl shadow-black/20">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-300">Smart Parks KPIs</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">{smartParkKpis.map(renderCard)}</div>
      </div>
    </section>
  );
}

import { motion, useReducedMotion } from 'framer-motion';
import { Bot, Camera, Cpu, Link, Trees, type LucideIcon } from 'lucide-react';
import type { ParkRecord } from '../types/park';
import {
  getDmtIntegratedSmartParksCount,
  getParksWithCctv,
  getParksWithoutCctv,
  getSmartParksCount,
  getSmartParksWithVisitorCountingCount,
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

export default function KpiCards({ parks, isLoading = false }: KpiCardsProps) {
  const shouldReduceMotion = useReducedMotion();
  const totalParksInventory = getTotalParks(parks);
  const parksWithCctv = getParksWithCctv(parks);
  const parksWithoutCctv = getParksWithoutCctv(parks);
  const parksNeedingCctv = Math.max(0, totalParksInventory - parksWithCctv);
  const primaryKpis = [
    {
      label: 'Total Parks Inventory',
      value: formatNumber(totalParksInventory),
      helper: 'Excel inventory records',
      icon: Trees,
    },
    {
      label: 'Parks with CCTV',
      value: formatNumber(parksWithCctv),
      helper: 'Park-level CCTV available',
      icon: Camera,
    },
    {
      label: 'Parks without CCTV',
      value: formatNumber(parksWithoutCctv),
      helper: 'CCTV status = No',
      icon: Camera,
    },
    {
      label: 'Need CCTV',
      value: formatNumber(parksNeedingCctv),
      helper: 'For full park-level availability',
      icon: Camera,
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
      <motion.article
        key={kpi.label}
        className="grid h-[124px] min-w-0 grid-rows-[34px_1fr_24px] overflow-hidden rounded-xl border border-white/10 bg-slate-950/55 p-3 transition-colors hover:border-cyan-300/30"
        whileHover={shouldReduceMotion ? undefined : { y: -2 }}
        transition={{ duration: 0.18 }}
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
      </motion.article>
    );
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-3.5 shadow-xl shadow-black/20">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">Public Parks Inventory</h2>
          <p className="mt-1 text-xs text-slate-400">Smart parks are included within the public parks inventory.</p>
        </div>
        <span className="rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1 text-xs font-semibold text-violet-100">
          Smart Parks Subset
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] xl:items-stretch">
        <div className="min-w-0">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Public Parks Inventory</h3>
            <p className="hidden text-[11px] text-slate-500 sm:block">park-level CCTV availability</p>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">{primaryKpis.map(renderCard)}</div>
        </div>

        <div className="hidden w-px bg-white/10 xl:block" aria-hidden="true" />

        <div className="min-w-0 rounded-xl border border-violet-300/15 bg-violet-300/[0.03] p-2.5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-violet-100">Smart Parks Subset</h3>
            <p className="hidden text-[11px] text-slate-500 sm:block">confirmed project-team list</p>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">{smartParkKpis.map(renderCard)}</div>
        </div>
      </div>
    </section>
  );
}

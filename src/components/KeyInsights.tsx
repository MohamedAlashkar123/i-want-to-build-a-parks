import type { ParkRecord } from '../types/park';
import type { TranslationDictionary } from '../i18n/translations';
import {
  getMissingGisCoordinatesCount,
  getParksWithoutCctv,
  getStandaloneCameraSetupCount,
} from '../utils/dashboardCalculations';

type KeyInsightsProps = {
  parks: ParkRecord[];
  t: TranslationDictionary;
  isLoading?: boolean;
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export default function KeyInsights({ parks, t, isLoading = false }: KeyInsightsProps) {
  const insights = [
    [t.insightNoCctv, getParksWithoutCctv(parks)],
    [t.insightMissingGis, getMissingGisCoordinatesCount(parks)],
    [t.insightStandaloneSystems, getStandaloneCameraSetupCount(parks)],
  ];

  return (
    <section className="max-w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/20">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-white">{t.keyInsightsTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">{t.keyInsightsSubtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {insights.map(([label, value]) => (
          <article key={label} className="min-w-0 rounded-xl border border-white/10 bg-slate-950/70 p-4">
            <p className="truncate text-sm text-slate-400" title={String(label)}>
              {label}
            </p>
            <p className="mt-2 text-2xl font-bold text-white">{isLoading ? '-' : formatNumber(Number(value))}</p>
          </article>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm font-semibold leading-7 text-amber-50">
        {t.keyInsightMainNote}
      </div>
    </section>
  );
}

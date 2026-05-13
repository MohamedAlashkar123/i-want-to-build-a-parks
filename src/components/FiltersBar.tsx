import type { ParkRecord } from '../types/park';
import type { TranslationDictionary } from '../i18n/translations';

export type MapMunicipalityFilter = 'All' | 'ADM' | 'AAM' | 'DRM';
export type MapCctvFilter = 'All' | ParkRecord['hasCctvSystem'];

type FiltersBarProps = {
  municipality: MapMunicipalityFilter;
  cctvStatus: MapCctvFilter;
  t: TranslationDictionary;
  onMunicipalityChange: (value: MapMunicipalityFilter) => void;
  onCctvStatusChange: (value: MapCctvFilter) => void;
  onReset: () => void;
};

export default function FiltersBar({
  municipality,
  cctvStatus,
  t,
  onMunicipalityChange,
  onCctvStatusChange,
  onReset,
}: FiltersBarProps) {
  return (
    <section className="max-w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/20">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-white">{t.displayFilters}</h2>
        <button
          className="w-fit rounded-xl border border-cyan-300/30 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/10"
          type="button"
          onClick={onReset}
        >
          {t.reset}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="min-w-0 space-y-2 text-sm font-medium text-slate-300">
          <span className="block truncate">{t.municipality}</span>
          <select
            className="h-12 w-full rounded-xl border border-white/10 bg-slate-950 px-4 text-base text-slate-200 outline-none transition focus:border-cyan-300/60"
            value={municipality}
            onChange={(event) => onMunicipalityChange(event.target.value as MapMunicipalityFilter)}
          >
            <option value="All">{t.all}</option>
            <option value="ADM">ADM</option>
            <option value="AAM">AAM</option>
            <option value="DRM">DRM</option>
          </select>
        </label>

        <label className="min-w-0 space-y-2 text-sm font-medium text-slate-300">
          <span className="block truncate">{t.cctvStatus}</span>
          <select
            className="h-12 w-full rounded-xl border border-white/10 bg-slate-950 px-4 text-base text-slate-200 outline-none transition focus:border-cyan-300/60"
            value={cctvStatus}
            onChange={(event) => onCctvStatusChange(event.target.value as MapCctvFilter)}
          >
            <option value="All">{t.all}</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
            <option value="Unknown">Unknown</option>
          </select>
        </label>

        <label className="min-w-0 space-y-2 text-sm font-medium text-slate-500">
          <span className="block truncate">{t.region}</span>
          <select
            className="h-12 w-full rounded-xl border border-white/10 bg-slate-950 px-4 text-base text-slate-500 outline-none"
            disabled
          >
            <option>{t.later}</option>
          </select>
        </label>

        <label className="min-w-0 space-y-2 text-sm font-medium text-slate-500">
          <span className="block truncate">{t.systemType}</span>
          <select
            className="h-12 w-full rounded-xl border border-white/10 bg-slate-950 px-4 text-base text-slate-500 outline-none"
            disabled
          >
            <option>Standalone</option>
          </select>
        </label>
      </div>
    </section>
  );
}

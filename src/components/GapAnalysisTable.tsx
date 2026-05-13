import { useEffect, useMemo, useState } from 'react';
import type { ParkRecord } from '../types/park';
import type { TranslationDictionary } from '../i18n/translations';
import { generateGapAnalysis, type GapAnalysisRecord } from '../utils/gapAnalysis';

type GapAnalysisTableProps = {
  parks: ParkRecord[];
  t: TranslationDictionary;
  isLoading?: boolean;
};

type MunicipalityFilter = 'All' | 'ADM' | 'AAM' | 'DRM' | 'Unknown';
type CategoryFilter = 'All' | string;
type PriorityFilter = 'All' | GapAnalysisRecord['priority'];
type StatusFilter = 'All' | GapAnalysisRecord['status'];

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function priorityClass(priority: GapAnalysisRecord['priority']): string {
  if (priority === 'High') {
    return 'border-red-400/30 bg-red-500/15 text-red-100';
  }

  if (priority === 'Medium') {
    return 'border-amber-300/30 bg-amber-400/15 text-amber-100';
  }

  return 'border-emerald-300/30 bg-emerald-400/15 text-emerald-100';
}

function statusClass(status: GapAnalysisRecord['status']): string {
  return status === 'Open'
    ? 'border-cyan-300/30 bg-cyan-400/15 text-cyan-100'
    : 'border-violet-300/30 bg-violet-400/15 text-violet-100';
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((first, second) => first.localeCompare(second));
}

export default function GapAnalysisTable({ parks, t, isLoading = false }: GapAnalysisTableProps) {
  const [municipality, setMunicipality] = useState<MunicipalityFilter>('All');
  const [gapCategory, setGapCategory] = useState<CategoryFilter>('All');
  const [priority, setPriority] = useState<PriorityFilter>('All');
  const [status, setStatus] = useState<StatusFilter>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const gaps = useMemo(() => generateGapAnalysis(parks), [parks]);
  const gapCategories = useMemo(() => uniqueSorted(gaps.map((gap) => gap.gapCategory)), [gaps]);

  const filteredGaps = useMemo(() => {
    return gaps.filter((gap) => {
      return (
        (municipality === 'All' || gap.municipality === municipality) &&
        (gapCategory === 'All' || gap.gapCategory === gapCategory) &&
        (priority === 'All' || gap.priority === priority) &&
        (status === 'All' || gap.status === status)
      );
    });
  }, [gapCategory, gaps, municipality, priority, status]);

  const totalPages = Math.max(1, Math.ceil(filteredGaps.length / rowsPerPage));
  const paginatedGaps = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredGaps.slice(startIndex, startIndex + rowsPerPage);
  }, [currentPage, filteredGaps, rowsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [gapCategory, municipality, priority, rowsPerPage, status]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const summary = useMemo(() => {
    return {
      total: filteredGaps.length,
      high: filteredGaps.filter((gap) => gap.priority === 'High').length,
      medium: filteredGaps.filter((gap) => gap.priority === 'Medium').length,
      low: filteredGaps.filter((gap) => gap.priority === 'Low').length,
      cctv: filteredGaps.filter((gap) => gap.gapCategory === 'CCTV').length,
      gis: filteredGaps.filter((gap) => gap.gapCategory === 'GIS').length,
      maintenance: filteredGaps.filter((gap) => gap.gapCategory === 'Maintenance').length,
      integration: filteredGaps.filter((gap) => gap.gapCategory === 'Integration').length,
    };
  }, [filteredGaps]);

  const summaryCards = [
    [t.totalGaps, summary.total],
    [t.highPriorityGaps, summary.high],
    [t.mediumPriorityGaps, summary.medium],
    [t.lowPriorityGaps, summary.low],
    [t.cctvGaps, summary.cctv],
    [t.gisGaps, summary.gis],
    [t.maintenanceGaps, summary.maintenance],
    [t.integrationGaps, summary.integration],
  ];
  const columns = [t.municipality, t.park, t.gapType, t.issue, t.recommendation, t.priority, t.status];

  return (
    <section className="max-w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/20">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-white">{t.gapAnalysisTitle}</h2>
          <p className="mt-2 break-words text-sm leading-7 text-slate-400">
            {t.gapAnalysisSubtitle}
          </p>
        </div>

        <span className="w-fit shrink-0 rounded-full border border-white/10 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-200">
          {isLoading ? t.loadingAnalysis : `${formatNumber(filteredGaps.length)} ${t.filteredResults}`}
        </span>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        {summaryCards.map(([label, value]) => (
          <article key={label} className="min-w-0 rounded-xl border border-white/10 bg-slate-950/70 p-3">
            <p className="truncate text-xs text-slate-400" title={String(label)}>
              {label}
            </p>
            <p className="mt-2 text-2xl font-bold text-white">{isLoading ? '-' : formatNumber(Number(value))}</p>
          </article>
        ))}
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="min-w-0 text-sm text-slate-300">
          {t.municipality}
          <select
            className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-300"
            value={municipality}
            onChange={(event) => setMunicipality(event.target.value as MunicipalityFilter)}
          >
            <option value="All">{t.all}</option>
            <option value="ADM">ADM</option>
            <option value="AAM">AAM</option>
            <option value="DRM">DRM</option>
            <option value="Unknown">Unknown</option>
          </select>
        </label>

        <label className="min-w-0 text-sm text-slate-300">
          {t.gapType}
          <select
            className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-300"
            value={gapCategory}
            onChange={(event) => setGapCategory(event.target.value)}
          >
            <option value="All">{t.all}</option>
            {gapCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="min-w-0 text-sm text-slate-300">
          {t.priority}
          <select
            className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-300"
            value={priority}
            onChange={(event) => setPriority(event.target.value as PriorityFilter)}
          >
            <option value="All">{t.all}</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </label>

        <label className="min-w-0 text-sm text-slate-300">
          {t.status}
          <select
            className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-300"
            value={status}
            onChange={(event) => setStatus(event.target.value as StatusFilter)}
          >
            <option value="All">{t.all}</option>
            <option value="Open">Open</option>
            <option value="To be validated">To be validated</option>
          </select>
        </label>
      </div>

      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-white/10 bg-slate-950/70 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-300">
          {t.showing} {isLoading || filteredGaps.length === 0 ? '0' : formatNumber((currentPage - 1) * rowsPerPage + 1)}-
          {formatNumber(Math.min(currentPage * rowsPerPage, filteredGaps.length))} {t.of} {formatNumber(filteredGaps.length)}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            {t.rowsPerPage}
            <select
              className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-300"
              value={rowsPerPage}
              onChange={(event) => setRowsPerPage(Number(event.target.value))}
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>

          <button
            className="rounded-lg border border-white/10 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
            type="button"
            disabled={currentPage <= 1 || isLoading}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
          >
            {t.previous}
          </button>
          <span className="text-sm text-slate-300">
            {t.page} {formatNumber(currentPage)} {t.of} {formatNumber(totalPages)}
          </span>
          <button
            className="rounded-lg border border-white/10 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
            type="button"
            disabled={currentPage >= totalPages || isLoading}
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
          >
            {t.next}
          </button>
        </div>
      </div>

      <div className="max-h-[650px] max-w-full overflow-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[1180px] border-collapse text-right text-sm">
          <thead className="sticky top-0 z-10 bg-slate-950 text-slate-300">
            <tr>
              {columns.map((column) => (
                <th key={column} className="whitespace-nowrap px-4 py-3 font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 bg-slate-950/50">
            {isLoading && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-slate-500">
                  {t.generatingGapAnalysis}
                </td>
              </tr>
            )}

            {!isLoading &&
              paginatedGaps.map((gap) => (
                <tr key={gap.id} className="align-top hover:bg-white/[0.03]">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-100">{gap.municipality}</td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-slate-100" title={gap.parkName}>
                    {gap.parkName}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-300">{gap.gapCategory}</td>
                  <td className="min-w-[220px] px-4 py-3 leading-7 text-slate-200">{gap.issue}</td>
                  <td className="min-w-[340px] px-4 py-3 leading-7 text-slate-300">{gap.recommendedAction}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${priorityClass(gap.priority)}`}>
                      {gap.priority}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(gap.status)}`}>
                      {gap.status}
                    </span>
                  </td>
                </tr>
              ))}

            {!isLoading && paginatedGaps.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-slate-500">
                  {t.noMatchingGaps}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

import { Download } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ParkRecord } from '../types/park';
import {
  getGisDataQualitySummary,
  getProjectedXYRecords,
  type GisReviewRecord,
} from '../utils/gisDataQuality';
import AdmXYConversionValidation from './AdmXYConversionValidation';
import CollapsibleSection from './CollapsibleSection';

type GisConversionReadinessProps = {
  parks: ParkRecord[];
  isLoading?: boolean;
};

type MunicipalityFilter = 'All' | 'ADM' | 'AAM' | 'DRM';

const requiredAction = 'Confirm CRS/EPSG before conversion to Latitude/Longitude';

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatOptional(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return String(value);
}

function uniqueSorted(values: Array<string | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))].sort((first, second) =>
    first.localeCompare(second),
  );
}

function csvEscape(value: string | number | undefined): string {
  const stringValue = formatOptional(value);
  return `"${stringValue.replace(/"/g, '""')}"`;
}

function buildCsv(records: GisReviewRecord[]): string {
  const headers = [
    'municipality',
    'parkName',
    'region',
    'parkType',
    'coordinateRaw',
    'sourceSheet',
    'sourceRowNumber',
    'coordinateSource',
    'coordinateConversionStatus',
    'requiredAction',
  ];

  const rows = records.map((record) =>
    [
      record.municipality,
      record.parkName,
      record.region,
      record.parkType,
      record.coordinateRaw,
      record.sourceSheet,
      record.sourceRowNumber,
      record.coordinateSource,
      record.coordinateConversionStatus,
      requiredAction,
    ]
      .map(csvEscape)
      .join(','),
  );

  return [headers.join(','), ...rows].join('\n');
}

export default function GisConversionReadiness({ parks, isLoading = false }: GisConversionReadinessProps) {
  const [municipality, setMunicipality] = useState<MunicipalityFilter>('All');
  const [region, setRegion] = useState('All');
  const [sourceSheet, setSourceSheet] = useState('All');

  const summary = getGisDataQualitySummary(parks);
  const projectedRecords = useMemo(() => getProjectedXYRecords(parks), [parks]);
  const regions = useMemo(() => uniqueSorted(projectedRecords.map((record) => record.region)), [projectedRecords]);
  const sourceSheets = useMemo(
    () => uniqueSorted(projectedRecords.map((record) => record.sourceSheet)),
    [projectedRecords],
  );
  const filteredRecords = useMemo(() => {
    return projectedRecords.filter((record) => {
      return (
        (municipality === 'All' || record.municipality === municipality) &&
        (region === 'All' || record.region === region) &&
        (sourceSheet === 'All' || record.sourceSheet === sourceSheet)
      );
    });
  }, [municipality, projectedRecords, region, sourceSheet]);
  const previewRecords = filteredRecords.slice(0, 25);

  function exportCsv() {
    const csv = buildCsv(filteredRecords);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'projected-xy-crs-review.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  const summaryCards = [
    ['Ready for map', summary.readyForMap],
    ['Converted ADM X/Y', summary.convertedAdmXy],
    ['Projected X/Y pending review', summary.projectedXy],
    ['Missing / invalid GIS', summary.missingOrInvalid],
  ];

  return (
    <CollapsibleSection
      title="GIS Conversion Readiness"
      subtitle="ADM X/Y coordinates are converted for map visualization; remaining projected records stay available for review."
      defaultOpen={false}
      showText="Show X/Y review table"
      hideText="Hide X/Y review table"
      actions={
        <button
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-50 transition hover:border-cyan-300/45 hover:bg-cyan-300/15"
          type="button"
          onClick={exportCsv}
          disabled={isLoading || filteredRecords.length === 0}
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Export X/Y Review CSV
        </button>
      }
      summaryContent={
        <>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        {summaryCards.map(([label, value]) => (
          <article key={label} className="rounded-xl border border-white/10 bg-slate-950/70 p-4">
            <p className="truncate text-xs text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-white">{isLoading ? '-' : formatNumber(Number(value))}</p>
          </article>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3">
        <p className="text-xs leading-5 text-slate-400">
          Detailed projected X/Y records are available for CRS review and export.
        </p>
      </div>

      <AdmXYConversionValidation parks={parks} isLoading={isLoading} />
        </>
      }
    >
      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <label className="min-w-0 text-sm text-slate-300">
          Municipality
          <select
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-300/50"
            value={municipality}
            onChange={(event) => setMunicipality(event.target.value as MunicipalityFilter)}
          >
            <option value="All">All</option>
            <option value="ADM">ADM</option>
            <option value="AAM">AAM</option>
            <option value="DRM">DRM</option>
          </select>
        </label>

        <label className="min-w-0 text-sm text-slate-300">
          Region
          <select
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-300/50"
            value={region}
            onChange={(event) => setRegion(event.target.value)}
          >
            <option value="All">All</option>
            {regions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="min-w-0 text-sm text-slate-300">
          Source Sheet
          <select
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-300/50"
            value={sourceSheet}
            onChange={(event) => setSourceSheet(event.target.value)}
          >
            <option value="All">All</option>
            {sourceSheets.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="max-w-full overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
          <thead className="bg-slate-950 text-slate-300">
            <tr>
              <th className="whitespace-nowrap px-4 py-3 font-semibold">Municipality</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold">Park Name</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold">Region</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold">Park Type</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold">Raw X/Y Coordinate</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold">Source Sheet</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold">Source Row</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 bg-slate-950/50">
            {isLoading && (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={8}>
                  Loading GIS conversion review...
                </td>
              </tr>
            )}

            {!isLoading &&
              previewRecords.map((record) => (
                <tr key={`${record.sourceSheet}-${record.sourceRowNumber}`} className="align-top hover:bg-white/[0.03]">
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-white">{record.municipality}</td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-slate-100" title={record.parkName}>
                    {record.parkName}
                  </td>
                  <td className="max-w-[180px] truncate px-4 py-3 text-slate-300" title={record.region}>
                    {formatOptional(record.region)}
                  </td>
                  <td className="max-w-[160px] truncate px-4 py-3 text-slate-300" title={record.parkType}>
                    {formatOptional(record.parkType)}
                  </td>
                  <td className="max-w-[260px] truncate px-4 py-3 text-amber-100" title={record.coordinateRaw}>
                    {formatOptional(record.coordinateRaw)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-300">{record.sourceSheet}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-300">{record.sourceRowNumber}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-50">
                      {formatOptional(record.coordinateConversionStatus)}
                    </span>
                  </td>
                </tr>
              ))}

            {!isLoading && previewRecords.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={8}>
                  No projected X/Y records match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs leading-6 text-slate-500">
        Showing first 25 projected X/Y records after filtering. Use CSV export for the full review list.
      </p>
    </CollapsibleSection>
  );
}

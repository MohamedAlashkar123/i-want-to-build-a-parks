import type { ParkRecord } from '../types/park';
import { getMunicipalitySummary } from '../utils/dashboardCalculations';
import CollapsibleSection from './CollapsibleSection';

type MunicipalitySummaryTableProps = {
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

function cctvPercentage(withCctv: number, total: number): number {
  return total === 0 ? 0 : (withCctv / total) * 100;
}

export default function MunicipalitySummaryTable({ parks, isLoading = false }: MunicipalitySummaryTableProps) {
  const rows = getMunicipalitySummary(parks);
  const highestParkCount = rows.reduce((best, row) => (row.totalParks > best.totalParks ? row : best), rows[0]);
  const highestCctvAvailability = rows.reduce(
    (best, row) =>
      cctvPercentage(row.parksWithCctv, row.totalParks) > cctvPercentage(best.parksWithCctv, best.totalParks) ? row : best,
    rows[0],
  );
  const highestGisReadiness = rows.reduce((best, row) => (row.validGis > best.validGis ? row : best), rows[0]);
  const highestPendingGis = rows.reduce(
    (best, row) => (row.missingOrInvalidGis > best.missingOrInvalidGis ? row : best),
    rows[0],
  );
  const summaryCards = [
    {
      label: 'Highest Park Count',
      value: highestParkCount ? `${highestParkCount.municipality} - ${formatNumber(highestParkCount.totalParks)}` : '-',
    },
    {
      label: 'Highest CCTV Availability',
      value: highestCctvAvailability
        ? `${highestCctvAvailability.municipality} - ${formatPercentage(
            cctvPercentage(highestCctvAvailability.parksWithCctv, highestCctvAvailability.totalParks),
          )}`
        : '-',
    },
    {
      label: 'Highest GIS Readiness',
      value: highestGisReadiness ? `${highestGisReadiness.municipality} - ${formatNumber(highestGisReadiness.validGis)}` : '-',
    },
    {
      label: 'Highest Pending / Missing GIS',
      value: highestPendingGis ? `${highestPendingGis.municipality} - ${formatNumber(highestPendingGis.missingOrInvalidGis)}` : '-',
    },
  ];

  return (
    <CollapsibleSection
      title="Municipality CCTV & GIS Summary"
      subtitle="Comparison of CCTV availability, camera inventory, and GIS readiness across ADM, AAM, and DRM."
      defaultOpen
      summaryContent={
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <article key={card.label} className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-3">
                <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
                <p className="mt-1 truncate text-base font-bold text-white">{isLoading ? '-' : card.value}</p>
              </article>
            ))}
          </div>
          <p className="text-xs leading-6 text-slate-500">
            CCTV % represents park-level CCTV availability, not physical surveillance coverage.
          </p>
        </div>
      }
    >
      <div className="max-w-full overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[940px] border-collapse text-left text-sm">
          <thead className="bg-slate-950 text-slate-300">
            <tr>
              <th className="whitespace-nowrap px-3 py-2.5 font-semibold">Municipality</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-semibold">Total Parks</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-semibold">With CCTV</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-semibold">Without CCTV</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-semibold">CCTV %</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-semibold">Total Cameras</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-semibold">Valid GIS</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-semibold">Pending / Missing GIS</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-semibold">Maintenance Contracts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 bg-slate-950/50">
            {isLoading && (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={9}>
                  Loading municipality summary...
                </td>
              </tr>
            )}

            {!isLoading &&
              rows.map((row) => {
                const pendingOrMissingGis = row.missingOrInvalidGis;

                return (
                  <tr key={row.municipality} className="hover:bg-white/[0.03]">
                    <td className="whitespace-nowrap px-3 py-2.5 text-base font-bold text-white">{row.municipality}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-slate-200">{formatNumber(row.totalParks)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-emerald-100">{formatNumber(row.parksWithCctv)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-red-100">{formatNumber(row.parksWithoutCctv)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-2.5 py-1 text-xs font-bold text-cyan-50">
                        {formatPercentage(cctvPercentage(row.parksWithCctv, row.totalParks))}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-slate-200">{formatNumber(row.totalCameras)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-xs font-bold text-emerald-50">
                        {formatNumber(row.validGis)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-xs font-bold text-amber-50">
                        {formatNumber(pendingOrMissingGis)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-slate-200">{formatNumber(row.maintenanceContracts)}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </CollapsibleSection>
  );
}

import type { ParkRecord } from '../types/park';
import { getMunicipalitySummary } from '../utils/dashboardCalculations';

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

  return (
    <section className="max-w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900/75 p-5 shadow-xl shadow-black/20">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-white">Municipality Summary</h2>
        <p className="mt-1 text-sm text-slate-400">Park-level CCTV availability and GIS readiness by municipality.</p>
      </div>

      <div className="max-w-full overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[980px] border-collapse text-left text-sm">
          <thead className="bg-slate-950 text-slate-300">
            <tr>
              <th className="whitespace-nowrap px-4 py-3 font-semibold">Municipality</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold">Total Parks</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold">With CCTV</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold">Without CCTV</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold">CCTV %</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold">Total Cameras</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold">Valid GIS</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold">Pending / Missing GIS</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold">Maintenance Contracts</th>
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
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-white">{row.municipality}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-200">{formatNumber(row.totalParks)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-emerald-100">{formatNumber(row.parksWithCctv)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-red-100">{formatNumber(row.parksWithoutCctv)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-50">
                        {formatPercentage(cctvPercentage(row.parksWithCctv, row.totalParks))}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-200">{formatNumber(row.totalCameras)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-emerald-100">{formatNumber(row.validGis)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-50">
                        {formatNumber(pendingOrMissingGis)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-200">{formatNumber(row.maintenanceContracts)}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs leading-6 text-slate-500">CCTV % is park-level CCTV availability, not physical camera coverage.</p>
    </section>
  );
}

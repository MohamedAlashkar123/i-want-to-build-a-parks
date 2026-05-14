import { Calculator } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ParkRecord } from '../types/park';
import { getAdmXYConversionSamples } from '../utils/coordinateConversion';

type AdmXYConversionValidationProps = {
  parks: ParkRecord[];
  isLoading?: boolean;
};

function formatCoordinate(value: number): string {
  return value.toFixed(6);
}

function formatProjected(value: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 4,
  }).format(value);
}

function formatOptional(value: string | undefined): string {
  return value && value.trim() ? value : '-';
}

export default function AdmXYConversionValidation({ parks, isLoading = false }: AdmXYConversionValidationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const samples = useMemo(() => getAdmXYConversionSamples(parks, 10), [parks]);

  return (
    <section className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/5 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-amber-100" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-white">ADM EPSG:32640 Conversion Validation</h3>
          </div>
          <p className="mt-2 max-w-4xl text-xs leading-5 text-amber-50/85">
            These coordinates were converted using EPSG:32640 (WGS 84 / UTM Zone 40N) for validation only. CRS/EPSG
            must be confirmed by GIS team before applying conversion to all records.
          </p>
        </div>
        <button
          className="inline-flex w-fit items-center rounded-lg border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-xs font-semibold text-amber-50 transition hover:border-amber-300/45 hover:bg-amber-300/15"
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          aria-expanded={isOpen}
        >
          {isOpen ? 'Hide ADM conversion samples' : 'Show ADM conversion samples'}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 max-w-full overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[980px] border-collapse text-left text-sm">
            <thead className="bg-slate-950 text-slate-300">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Park Name</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Region</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">X</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Y</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Converted Latitude</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Converted Longitude</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Google Maps Link</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 bg-slate-950/50">
              {isLoading && (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={8}>
                    Loading ADM conversion samples...
                  </td>
                </tr>
              )}

              {!isLoading &&
                samples.map((sample) => (
                  <tr key={`${sample.parkName}-${sample.x}-${sample.y}`} className="align-top hover:bg-white/[0.03]">
                    <td className="max-w-[220px] truncate px-4 py-3 font-semibold text-white" title={sample.parkName}>
                      {sample.parkName}
                    </td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-slate-300" title={sample.region}>
                      {formatOptional(sample.region)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-amber-100">{formatProjected(sample.x)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-amber-100">{formatProjected(sample.y)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-cyan-50">
                      {formatCoordinate(sample.convertedLatitude)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-cyan-50">
                      {formatCoordinate(sample.convertedLongitude)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <a
                        className="font-semibold text-cyan-200 underline-offset-4 hover:text-cyan-100 hover:underline"
                        href={sample.googleMapsUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open map
                      </a>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-50">
                        {sample.status}
                      </span>
                    </td>
                  </tr>
                ))}

              {!isLoading && samples.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={8}>
                    No ADM projected X/Y samples are available for validation.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

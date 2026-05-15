import { Bug } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ParkRecord } from '../types/park';

type AamGisDebugProps = {
  parks: ParkRecord[];
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatOptional(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return String(value);
}

function formatCoordinate(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(6) : '-';
}

function isMapGeoJsonIncluded(park: ParkRecord): boolean {
  return (
    park.municipality === 'AAM' &&
    park.canPlotOnMap === true &&
    typeof park.latitude === 'number' &&
    typeof park.longitude === 'number' &&
    park.latitude >= 22 &&
    park.latitude <= 26 &&
    park.longitude >= 51 &&
    park.longitude <= 57 &&
    park.gisValidationStatus !== 'Needs Review' &&
    park.gisValidationStatus !== 'Suspicious'
  );
}

export default function AamGisDebug({ parks }: AamGisDebugProps) {
  const [isOpen, setIsOpen] = useState(false);
  const aamRecords = useMemo(() => parks.filter((park) => park.municipality === 'AAM'), [parks]);
  const geoJsonCounts = useMemo(
    () => ({
      ADM: parks.filter((park) => park.municipality === 'ADM' && park.canPlotOnMap).length,
      AAM: parks.filter((park) => park.municipality === 'AAM' && park.canPlotOnMap).length,
      DRM: parks.filter((park) => park.municipality === 'DRM' && park.canPlotOnMap).length,
    }),
    [parks],
  );
  const samples = aamRecords.slice(0, 10);
  const metrics = [
    ['Total AAM records', aamRecords.length],
    ['AAM rows with detected X value', aamRecords.filter((park) => park.xyParsedX !== null && park.xyParsedX !== undefined).length],
    ['AAM rows with detected Y value', aamRecords.filter((park) => park.xyParsedY !== null && park.xyParsedY !== undefined).length],
    [
      'AAM rows with both X and Y',
      aamRecords.filter(
        (park) => park.xyParsedX !== null && park.xyParsedX !== undefined && park.xyParsedY !== null && park.xyParsedY !== undefined,
      ).length,
    ],
    ['AAM converted successfully', aamRecords.filter((park) => park.coordinateSource === 'Converted AAM X/Y').length],
    ['AAM rejected by validation', aamRecords.filter((park) => park.coordinateConversionStatus === 'Conversion Review Required').length],
    ['AAM canPlotOnMap = true', aamRecords.filter((park) => park.canPlotOnMap).length],
    ['AAM included in map GeoJSON', aamRecords.filter(isMapGeoJsonIncluded).length],
    ['GeoJSON ADM count', geoJsonCounts.ADM],
    ['GeoJSON AAM count', geoJsonCounts.AAM],
    ['GeoJSON DRM count', geoJsonCounts.DRM],
  ];

  return (
    <section className="mt-4 rounded-xl border border-orange-300/20 bg-orange-300/5 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Bug className="h-4 w-4 text-orange-100" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-white">AAM GIS Debug</h3>
        </div>
        <button
          className="inline-flex w-fit items-center rounded-lg border border-orange-300/25 bg-orange-300/10 px-3 py-2 text-xs font-semibold text-orange-50 transition hover:border-orange-300/45 hover:bg-orange-300/15"
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          aria-expanded={isOpen}
        >
          {isOpen ? 'Hide AAM debug' : 'Show AAM debug'}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map(([label, value]) => (
              <article key={label} className="rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2">
                <p className="truncate text-[11px] text-slate-500">{label}</p>
                <p className="mt-1 text-base font-bold text-white">{formatNumber(Number(value))}</p>
              </article>
            ))}
          </div>

          <div className="max-w-full overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[1500px] border-collapse text-left text-xs">
              <thead className="bg-slate-950 text-slate-300">
                <tr>
                  <th className="whitespace-nowrap px-3 py-2 font-semibold">Park Name</th>
                  <th className="whitespace-nowrap px-3 py-2 font-semibold">Source Sheet</th>
                  <th className="whitespace-nowrap px-3 py-2 font-semibold">Source Row</th>
                  <th className="whitespace-nowrap px-3 py-2 font-semibold">Raw X</th>
                  <th className="whitespace-nowrap px-3 py-2 font-semibold">Raw Y</th>
                  <th className="whitespace-nowrap px-3 py-2 font-semibold">Parsed X</th>
                  <th className="whitespace-nowrap px-3 py-2 font-semibold">Parsed Y</th>
                  <th className="whitespace-nowrap px-3 py-2 font-semibold">Converted Latitude</th>
                  <th className="whitespace-nowrap px-3 py-2 font-semibold">Converted Longitude</th>
                  <th className="whitespace-nowrap px-3 py-2 font-semibold">Coordinate Source</th>
                  <th className="whitespace-nowrap px-3 py-2 font-semibold">Conversion Status</th>
                  <th className="whitespace-nowrap px-3 py-2 font-semibold">Can Plot</th>
                  <th className="whitespace-nowrap px-3 py-2 font-semibold">GIS Status</th>
                  <th className="whitespace-nowrap px-3 py-2 font-semibold">GIS Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 bg-slate-950/50">
                {samples.map((park) => (
                  <tr key={park.id} className="align-top hover:bg-white/[0.03]">
                    <td className="max-w-[220px] truncate px-3 py-2 font-semibold text-white" title={park.parkName}>
                      {park.parkName}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-300">{park.sourceSheet}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-300">{park.sourceRowNumber}</td>
                    <td className="max-w-[160px] truncate px-3 py-2 text-amber-100" title={park.xyRawX}>
                      {formatOptional(park.xyRawX)}
                    </td>
                    <td className="max-w-[160px] truncate px-3 py-2 text-amber-100" title={park.xyRawY}>
                      {formatOptional(park.xyRawY)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-200">{formatOptional(park.xyParsedX)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-200">{formatOptional(park.xyParsedY)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-cyan-50">{formatCoordinate(park.xyConvertedLatitude)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-cyan-50">{formatCoordinate(park.xyConvertedLongitude)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-300">{formatOptional(park.coordinateSource)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-300">{formatOptional(park.coordinateConversionStatus)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-300">{formatOptional(park.canPlotOnMap)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-300">{formatOptional(park.gisValidationStatus)}</td>
                    <td className="min-w-[260px] px-3 py-2 text-slate-400">{formatOptional(park.gisValidationReason)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

import { AlertTriangle, MapPinned } from 'lucide-react';
import type { ParkRecord } from '../types/park';
import {
  getParksWithoutCctv,
  getSmartParksCount,
  getStandaloneCameraSetupCount,
  getTotalParks,
} from '../utils/dashboardCalculations';
import SmartParksByMunicipalityCard from './SmartParksByMunicipalityCard';

type ExecutiveOverviewCardsProps = {
  parks: ParkRecord[];
  isLoading?: boolean;
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function KeyInsightsCard({ parks, isLoading = false }: ExecutiveOverviewCardsProps) {
  const missingInvalid = parks.filter(
    (park) =>
      !park.canPlotOnMap &&
      (park.coordinateConversionStatus === 'Missing' ||
        park.coordinateConversionStatus === 'Invalid' ||
        park.coordinateSource === 'Missing' ||
        park.coordinateSource === 'Unknown'),
  ).length;
  const insights = [
    ['Parks without CCTV', getParksWithoutCctv(parks)],
    ['Missing/invalid GIS records', missingInvalid],
    ['Standalone camera systems', getStandaloneCameraSetupCount(parks)],
    ['Confirmed smart parks', getSmartParksCount(parks)],
  ];

  return (
    <section className="h-full rounded-2xl border border-white/10 bg-slate-900/75 p-4 shadow-xl shadow-black/20">
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-200" aria-hidden="true" />
        <h2 className="text-base font-semibold text-white">Key Insights</h2>
      </div>
      <div className="space-y-2">
        {insights.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2">
            <p className="min-w-0 truncate text-xs text-slate-400">{label}</p>
            <p className="shrink-0 text-base font-bold text-white">{isLoading ? '-' : formatNumber(Number(value))}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 rounded-lg border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs font-semibold leading-5 text-amber-50">
        Confirmed smart parks are integrated with DMT systems. Integration status for the remaining CCTV inventory parks is not confirmed in the current dataset.
      </p>
    </section>
  );
}

function GisReadinessCard({ parks, isLoading = false }: ExecutiveOverviewCardsProps) {
  const totalParks = getTotalParks(parks);
  const needsGisReview = parks.filter(
    (park) => park.gisValidationStatus === 'Needs Review' || park.gisValidationStatus === 'Suspicious',
  ).length;
  const validGis = parks.filter(
    (park) => park.canPlotOnMap && park.gisValidationStatus !== 'Needs Review' && park.gisValidationStatus !== 'Suspicious',
  ).length;
  const googleMaps = parks.filter(
    (park) =>
      park.coordinateSource === 'Google Maps' &&
      park.canPlotOnMap &&
      park.gisValidationStatus !== 'Needs Review' &&
      park.gisValidationStatus !== 'Suspicious',
  ).length;
  const projectedXy = parks.filter((park) => park.coordinateSource === 'Projected XY').length;
  const missingInvalid = parks.filter(
    (park) =>
      !park.canPlotOnMap &&
      (park.coordinateConversionStatus === 'Missing' ||
        park.coordinateConversionStatus === 'Invalid' ||
        park.coordinateSource === 'Missing' ||
        park.coordinateSource === 'Unknown'),
  ).length;
  const gisReadyPercent = totalParks === 0 ? 0 : (validGis / totalParks) * 100;

  return (
    <section className="h-full rounded-2xl border border-white/10 bg-slate-900/75 p-4 shadow-xl shadow-black/20">
      <div className="mb-3 flex items-center gap-2">
        <MapPinned className="h-4 w-4 text-emerald-100" aria-hidden="true" />
        <h2 className="text-base font-semibold text-white">GIS Readiness</h2>
      </div>
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-slate-400">Ready for map</span>
          <span className="text-xs font-semibold text-white">{isLoading ? '-' : `${gisReadyPercent.toFixed(1)}%`}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-950">
          <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.min(100, gisReadyPercent)}%` }} />
        </div>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          {[
            ['Valid GIS', validGis],
            ['Google Maps', googleMaps],
            ['Needs GIS Review', needsGisReview],
            ['X/Y Pending', projectedXy],
            ['Missing GIS', missingInvalid],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3 rounded-lg bg-slate-950/60 px-3 py-2">
              <span className="text-xs text-slate-400">{label}</span>
              <span className="text-sm font-semibold text-white">{isLoading ? '-' : formatNumber(Number(value))}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function ExecutiveOverviewCards({ parks, isLoading = false }: ExecutiveOverviewCardsProps) {
  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <KeyInsightsCard parks={parks} isLoading={isLoading} />
      <GisReadinessCard parks={parks} isLoading={isLoading} />
      <SmartParksByMunicipalityCard parks={parks} isLoading={isLoading} compact />
    </section>
  );
}

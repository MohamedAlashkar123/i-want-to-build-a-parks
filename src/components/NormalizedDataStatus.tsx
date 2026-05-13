import { useEffect, useMemo, useState } from 'react';
import { loadNormalizedParks } from '../data/normalizeParks';
import type { TranslationDictionary } from '../i18n/translations';
import type { ParkRecord } from '../types/park';

type LoadState = {
  status: 'loading' | 'success' | 'error';
  records: ParkRecord[];
  errorMessage?: string;
};

type NormalizedDataStatusProps = {
  t: TranslationDictionary;
};

function hasValidCoordinates(record: ParkRecord): boolean {
  return (
    typeof record.latitude === 'number' &&
    typeof record.longitude === 'number' &&
    record.latitude >= -90 &&
    record.latitude <= 90 &&
    record.longitude >= -180 &&
    record.longitude <= 180
  );
}

export default function NormalizedDataStatus({ t }: NormalizedDataStatusProps) {
  const [loadState, setLoadState] = useState<LoadState>({
    status: 'loading',
    records: [],
  });

  useEffect(() => {
    let isMounted = true;

    async function normalizeRecords() {
      try {
        const records = await loadNormalizedParks();

        if (isMounted) {
          setLoadState({ status: 'success', records });
        }
      } catch (error) {
        if (isMounted) {
          setLoadState({
            status: 'error',
            records: [],
            errorMessage: error instanceof Error ? error.message : 'تعذر توحيد بيانات الحدائق.',
          });
        }
      }
    }

    normalizeRecords();

    return () => {
      isMounted = false;
    };
  }, []);

  const summary = useMemo(() => {
    const records = loadState.records;
    const validCoordinates = records.filter(hasValidCoordinates).length;

    return {
      total: records.length,
      adm: records.filter((record) => record.municipality === 'ADM').length,
      aam: records.filter((record) => record.municipality === 'AAM').length,
      drm: records.filter((record) => record.municipality === 'DRM').length,
      withCctv: records.filter((record) => record.hasCctvSystem === 'Yes').length,
      withoutCctv: records.filter((record) => record.hasCctvSystem === 'No').length,
      unknownCctv: records.filter((record) => record.hasCctvSystem === 'Unknown').length,
      validCoordinates,
      googleMapsCoordinates: records.filter((record) => record.coordinateSource === 'Google Maps').length,
      projectedCoordinates: records.filter((record) => record.coordinateSource === 'Projected XY').length,
      missingCoordinates: records.filter((record) => record.coordinateSource === 'Missing').length,
      withQualityIssues: records.filter((record) => record.dataQualityIssues.length > 0).length,
    };
  }, [loadState.records]);

  const items = [
    [t.totalUnifiedRecords, summary.total],
    [t.admRecords, summary.adm],
    [t.aamRecords, summary.aam],
    [t.drmRecords, summary.drm],
    [t.kpiParksWithCctv, summary.withCctv],
    [t.kpiParksWithoutCctv, summary.withoutCctv],
    [t.unknownCctvStatus, summary.unknownCctv],
    [t.validGisRecords, summary.validCoordinates],
    [t.googleMapsRecords, summary.googleMapsCoordinates],
    [t.projectedXyRecords, summary.projectedCoordinates],
    [t.missingGisRecords, summary.missingCoordinates],
    [t.qualityIssueRecords, summary.withQualityIssues],
  ];

  return (
    <section className="max-w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/20">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-300">{t.normalizationLayer}</p>
          <h2 className="mt-1 text-xl font-semibold text-white">{t.normalizedDataSummary}</h2>
        </div>

        <span className="w-fit shrink-0 rounded-full border border-white/10 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-200">
          {loadState.status === 'loading' && t.normalizing}
          {loadState.status === 'success' && t.normalized}
          {loadState.status === 'error' && t.normalizationFailed}
        </span>
      </div>

      {loadState.status === 'error' && (
        <div className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-base leading-8 text-red-100">
          {loadState.errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {items.map(([label, value]) => (
          <div key={label} className="min-w-0 rounded-xl border border-white/10 bg-slate-950/70 p-4">
            <p className="truncate text-sm text-slate-400" title={String(label)}>
              {label}
            </p>
            <p className="mt-2 text-2xl font-bold text-white">{loadState.status === 'loading' ? '-' : value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

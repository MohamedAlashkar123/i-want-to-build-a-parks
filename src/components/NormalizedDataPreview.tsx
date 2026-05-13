import { useEffect, useMemo, useState } from 'react';
import { isValidLatLng, loadNormalizedParks } from '../data/normalizeParks';
import type { ParkRecord } from '../types/park';

type LoadState = {
  status: 'loading' | 'success' | 'error';
  records: ParkRecord[];
  errorMessage?: string;
};

type MunicipalityFilter = ParkRecord['municipality'] | 'All';
type CctvFilter = ParkRecord['hasCctvSystem'] | 'All';
type BooleanFilter = 'All' | 'Yes' | 'No';

const emptyValue = '-';

function formatOptional(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return emptyValue;
  }

  return String(value);
}

function formatIssues(issues: string[]): string {
  return issues.length > 0 ? issues.join(' | ') : emptyValue;
}

export default function NormalizedDataPreview() {
  const [loadState, setLoadState] = useState<LoadState>({
    status: 'loading',
    records: [],
  });
  const [municipality, setMunicipality] = useState<MunicipalityFilter>('All');
  const [cctvStatus, setCctvStatus] = useState<CctvFilter>('All');
  const [validGis, setValidGis] = useState<BooleanFilter>('All');
  const [qualityIssues, setQualityIssues] = useState<BooleanFilter>('All');

  useEffect(() => {
    let isMounted = true;

    async function loadRecords() {
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
            errorMessage: error instanceof Error ? error.message : 'تعذر تحميل معاينة البيانات الموحدة.',
          });
        }
      }
    }

    loadRecords();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredRecords = useMemo(() => {
    return loadState.records.filter((record) => {
      const recordHasValidGis = isValidLatLng(record.latitude, record.longitude);
      const recordHasIssues = record.dataQualityIssues.length > 0;

      return (
        (municipality === 'All' || record.municipality === municipality) &&
        (cctvStatus === 'All' || record.hasCctvSystem === cctvStatus) &&
        (validGis === 'All' || (validGis === 'Yes' ? recordHasValidGis : !recordHasValidGis)) &&
        (qualityIssues === 'All' || (qualityIssues === 'Yes' ? recordHasIssues : !recordHasIssues))
      );
    });
  }, [cctvStatus, loadState.records, municipality, qualityIssues, validGis]);

  const previewRecords = filteredRecords.slice(0, 50);

  return (
    <section className="max-w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/20">
      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-300">معاينة مؤقتة للتحقق</p>
          <h2 className="mt-1 text-xl font-semibold text-white">أول 50 سجل من البيانات الموحدة</h2>
          <p className="mt-2 text-sm leading-7 text-slate-400">
            هذا القسم مخصص لمراجعة جودة الربط والحقول أثناء التطوير، وليس جزءا من العرض التنفيذي.
          </p>
        </div>

        <span className="w-fit shrink-0 rounded-full border border-white/10 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-200">
          {loadState.status === 'loading' && 'جاري التحميل'}
          {loadState.status === 'success' && `${previewRecords.length} / ${filteredRecords.length}`}
          {loadState.status === 'error' && 'تعذر التحميل'}
        </span>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="min-w-0 text-sm text-slate-300">
          البلدية
          <select
            className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-300"
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
          حالة نظام CCTV
          <select
            className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-300"
            value={cctvStatus}
            onChange={(event) => setCctvStatus(event.target.value as CctvFilter)}
          >
            <option value="All">All</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
            <option value="Unknown">Unknown</option>
          </select>
        </label>

        <label className="min-w-0 text-sm text-slate-300">
          إحداثيات GIS
          <select
            className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-300"
            value={validGis}
            onChange={(event) => setValidGis(event.target.value as BooleanFilter)}
          >
            <option value="All">All</option>
            <option value="Yes">Valid</option>
            <option value="No">Missing</option>
          </select>
        </label>

        <label className="min-w-0 text-sm text-slate-300">
          مشاكل جودة البيانات
          <select
            className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-300"
            value={qualityIssues}
            onChange={(event) => setQualityIssues(event.target.value as BooleanFilter)}
          >
            <option value="All">All</option>
            <option value="Yes">Has Issues</option>
            <option value="No">No Issues</option>
          </select>
        </label>
      </div>

      {loadState.status === 'error' && (
        <div className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-base leading-8 text-red-100">
          {loadState.errorMessage}
        </div>
      )}

      <div className="max-w-full overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-[1650px] border-collapse text-right text-sm">
          <thead className="bg-slate-950 text-slate-300">
            <tr>
              <th className="whitespace-nowrap px-3 py-3 font-semibold">Municipality</th>
              <th className="whitespace-nowrap px-3 py-3 font-semibold">Source Sheet</th>
              <th className="whitespace-nowrap px-3 py-3 font-semibold">Source Row Number</th>
              <th className="whitespace-nowrap px-3 py-3 font-semibold">Park Name</th>
              <th className="whitespace-nowrap px-3 py-3 font-semibold">Region</th>
              <th className="whitespace-nowrap px-3 py-3 font-semibold">Park Type</th>
              <th className="whitespace-nowrap px-3 py-3 font-semibold">Has CCTV System</th>
              <th className="whitespace-nowrap px-3 py-3 font-semibold">Total Cameras</th>
              <th className="whitespace-nowrap px-3 py-3 font-semibold">Maintenance Contract</th>
              <th className="whitespace-nowrap px-3 py-3 font-semibold">Maintenance Company</th>
              <th className="whitespace-nowrap px-3 py-3 font-semibold">Has Drawings</th>
              <th className="whitespace-nowrap px-3 py-3 font-semibold">Coordinate Raw</th>
              <th className="whitespace-nowrap px-3 py-3 font-semibold">Latitude</th>
              <th className="whitespace-nowrap px-3 py-3 font-semibold">Longitude</th>
              <th className="whitespace-nowrap px-3 py-3 font-semibold">Data Quality Issues</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 bg-slate-950/50">
            {loadState.status === 'loading' && (
              <tr>
                <td className="px-3 py-4 text-slate-300" colSpan={15}>
                  جاري تحميل البيانات الموحدة...
                </td>
              </tr>
            )}

            {loadState.status === 'success' &&
              previewRecords.map((record) => (
                <tr key={record.id} className="align-top hover:bg-white/[0.03]">
                  <td className="whitespace-nowrap px-3 py-3 text-slate-100">{record.municipality}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-slate-300">{record.sourceSheet}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-slate-300">{record.sourceRowNumber}</td>
                  <td className="max-w-[220px] truncate px-3 py-3 text-slate-100" title={record.parkName}>
                    {record.parkName}
                  </td>
                  <td className="max-w-[180px] truncate px-3 py-3 text-slate-300" title={record.region}>
                    {formatOptional(record.region)}
                  </td>
                  <td className="max-w-[160px] truncate px-3 py-3 text-slate-300" title={record.parkType}>
                    {formatOptional(record.parkType)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-slate-300">{record.hasCctvSystem}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-slate-300">{record.totalCameras}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-slate-300">{record.hasMaintenanceContract}</td>
                  <td className="max-w-[240px] truncate px-3 py-3 text-slate-300" title={record.maintenanceCompany}>
                    {formatOptional(record.maintenanceCompany)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-slate-300">{record.hasDrawings}</td>
                  <td className="max-w-[320px] truncate px-3 py-3 text-slate-300" title={record.coordinateRaw}>
                    {formatOptional(record.coordinateRaw)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-slate-300">{formatOptional(record.latitude)}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-slate-300">{formatOptional(record.longitude)}</td>
                  <td
                    className="max-w-[280px] truncate px-3 py-3 text-slate-300"
                    title={formatIssues(record.dataQualityIssues)}
                  >
                    {formatIssues(record.dataQualityIssues)}
                  </td>
                </tr>
              ))}

            {loadState.status === 'success' && previewRecords.length === 0 && (
              <tr>
                <td className="px-3 py-4 text-slate-300" colSpan={15}>
                  لا توجد سجلات مطابقة للفلاتر الحالية.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

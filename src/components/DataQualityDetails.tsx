import type { ParkRecord } from '../types/park';

type DataQualityDetailsProps = {
  parks: ParkRecord[];
  isLoading?: boolean;
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export default function DataQualityDetails({ parks, isLoading = false }: DataQualityDetailsProps) {
  const issueRecords = parks.filter((park) => park.dataQualityIssues.length > 0);
  const items = [
    ['سجلات بها مشاكل جودة', issueRecords.length],
    ['إحداثيات مفقودة أو غير صالحة', issueRecords.filter((park) => park.dataQualityIssues.includes('Missing or invalid GIS coordinates')).length],
    ['إحداثيات X/Y تحتاج تحويل', issueRecords.filter((park) => park.dataQualityIssues.includes('Projected X/Y coordinates require conversion')).length],
    ['عدد كاميرات غير صالح', issueRecords.filter((park) => park.dataQualityIssues.includes('Invalid camera count')).length],
  ];

  return (
    <section className="max-w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/20">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-white">تفاصيل جودة البيانات</h2>
        <p className="mt-2 text-sm leading-7 text-slate-400">ملخص سريع لمشاكل البيانات قبل مراجعة جدول السجلات الموحدة.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map(([label, value]) => (
          <article key={label} className="min-w-0 rounded-xl border border-white/10 bg-slate-950/70 p-4">
            <p className="truncate text-sm text-slate-400" title={String(label)}>
              {label}
            </p>
            <p className="mt-2 text-2xl font-bold text-white">{isLoading ? '-' : formatNumber(Number(value))}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

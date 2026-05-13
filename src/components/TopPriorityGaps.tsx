import { ListChecks } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ParkRecord } from '../types/park';
import { generateGapAnalysis, type GapAnalysisRecord } from '../utils/gapAnalysis';

type TopPriorityGapsProps = {
  parks: ParkRecord[];
  isLoading?: boolean;
};

type MunicipalityFilter = 'All' | 'ADM' | 'AAM' | 'DRM';

function translateIssue(issue: string): string {
  const issueMap: Record<string, string> = {
    'لا يوجد نظام CCTV': 'No CCTV system recorded',
    'حالة نظام CCTV غير مؤكدة': 'CCTV system status is not confirmed',
    'نظام CCTV موجود ولكن عدد الكاميرات غير مسجل': 'CCTV exists but camera count is not recorded',
    'إحداثيات GIS غير متوفرة أو غير صالحة': 'GIS coordinates are missing or invalid',
    'لا يوجد عقد صيانة مسجل': 'No maintenance contract recorded',
    'حالة عقد الصيانة غير مؤكدة': 'Maintenance contract status is not confirmed',
    'مخططات الكاميرات غير متوفرة': 'Camera drawings are not available',
    'الكاميرات تعمل بشكل مستقل وغير مربوطة بأنظمة DMT': 'Cameras are standalone and not integrated with DMT systems',
  };

  return issueMap[issue] || issue;
}

function translateRecommendation(recommendation: string): string {
  const recommendationMap: Record<string, string> = {
    'تقييم الحاجة لتركيب نظام كاميرات حسب أهمية وموقع الحديقة':
      'Assess the need to install CCTV based on park importance and location.',
    'مراجعة البيانات مع البلدية المعنية وتأكيد حالة نظام الكاميرات':
      'Validate CCTV status with the relevant municipality.',
    'تحديث حصر الكاميرات وتأكيد العدد الفعلي':
      'Update the camera inventory and confirm the actual count.',
    'توفير إحداثيات Latitude/Longitude صحيحة للعرض على الخريطة':
      'Provide valid Latitude/Longitude coordinates for map display.',
    'تأكيد آلية الصيانة والجهة المسؤولة عن الدعم والتشغيل':
      'Confirm the maintenance model and responsible support entity.',
    'تأكيد وجود عقد صيانة للكاميرات مع الجهة المالكة أو البلدية':
      'Confirm whether a camera maintenance contract exists.',
    'توفير المخططات الفنية ومواقع الكاميرات لدعم التقييم والتوسعة':
      'Provide technical drawings and camera locations for assessment and expansion planning.',
    'تقييم إمكانية الربط المستقبلي مع الأنظمة المركزية حسب الأولوية والمتطلبات الأمنية':
      'Assess future integration with central systems based on priority and security requirements.',
  };

  return recommendationMap[recommendation] || recommendation;
}

function priorityRank(gap: GapAnalysisRecord): number {
  if (gap.priority === 'High') {
    return 0;
  }

  if (gap.priority === 'Medium') {
    return 1;
  }

  return 2;
}

export function getBalancedTopPriorityGaps(gaps: GapAnalysisRecord[]): GapAnalysisRecord[] {
  const sortedGaps = [...gaps].sort((first, second) => priorityRank(first) - priorityRank(second));
  const selected: GapAnalysisRecord[] = [];

  (['ADM', 'AAM', 'DRM'] as const).forEach((municipality) => {
    const highPriorityGap = sortedGaps.find(
      (gap) => gap.municipality === municipality && gap.priority === 'High' && !selected.some((selectedGap) => selectedGap.id === gap.id),
    );

    if (highPriorityGap) {
      selected.push(highPriorityGap);
    }
  });

  sortedGaps.forEach((gap) => {
    if (selected.length < 10 && !selected.some((selectedGap) => selectedGap.id === gap.id)) {
      selected.push(gap);
    }
  });

  return selected.slice(0, 10);
}

export default function TopPriorityGaps({ parks, isLoading = false }: TopPriorityGapsProps) {
  const [municipality, setMunicipality] = useState<MunicipalityFilter>('All');
  const allGaps = useMemo(() => generateGapAnalysis(parks), [parks]);
  const filteredGaps = useMemo(() => {
    return allGaps.filter((gap) => municipality === 'All' || gap.municipality === municipality);
  }, [allGaps, municipality]);
  const gaps = useMemo(() => {
    if (municipality === 'All') {
      return getBalancedTopPriorityGaps(filteredGaps);
    }

    return [...filteredGaps].sort((first, second) => priorityRank(first) - priorityRank(second)).slice(0, 10);
  }, [filteredGaps, municipality]);
  const highPriorityCount = filteredGaps.filter((gap) => gap.priority === 'High').length;
  const cctvGapsCount = filteredGaps.filter((gap) => gap.gapCategory === 'CCTV').length;
  const gisGapsCount = filteredGaps.filter((gap) => gap.gapCategory === 'GIS').length;
  const integrationGapsCount = filteredGaps.filter((gap) => gap.gapCategory === 'Integration').length;
  const summaryItems = [
    ['High priority gaps', highPriorityCount],
    ['CCTV gaps', cctvGapsCount],
    ['GIS gaps', gisGapsCount],
    ['Integration gaps', integrationGapsCount],
  ];

  return (
    <section className="max-w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900/75 p-5 shadow-xl shadow-black/20">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-white">Top 10 Priority Gaps</h2>
          <p className="mt-1 text-sm leading-6 text-slate-400">Highest-priority generated gaps for executive follow-up.</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            Municipality
            <select
              className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-300/50"
              value={municipality}
              onChange={(event) => setMunicipality(event.target.value as MunicipalityFilter)}
            >
              <option value="All">All</option>
              <option value="ADM">ADM</option>
              <option value="AAM">AAM</option>
              <option value="DRM">DRM</option>
            </select>
          </label>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-300/20 bg-amber-300/10 text-amber-100">
            <ListChecks className="h-5 w-5" aria-hidden="true" />
          </span>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryItems.map(([label, value]) => (
          <article key={label} className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
            <p className="truncate text-xs text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-white">{isLoading ? '-' : value}</p>
          </article>
        ))}
      </div>

      <p className="mb-4 rounded-xl border border-cyan-300/15 bg-cyan-300/10 px-4 py-3 text-sm leading-6 text-cyan-50">
        Top gaps are generated from the current inventory and can be filtered by municipality.
      </p>

      <div className="max-w-full overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[980px] border-collapse text-left text-sm">
          <thead className="bg-slate-950 text-slate-300">
            <tr>
              <th className="whitespace-nowrap px-4 py-3 font-semibold">Municipality</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold">Park</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold">Gap Type</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold">Issue</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold">Recommendation</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold">Priority</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 bg-slate-950/50">
            {isLoading && (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={6}>
                  Loading priority gaps...
                </td>
              </tr>
            )}

            {!isLoading &&
              gaps.map((gap) => (
                <tr key={gap.id} className="align-top hover:bg-white/[0.03]">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-100">{gap.municipality}</td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-slate-100" title={gap.parkName}>
                    {gap.parkName}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-300">{gap.gapCategory}</td>
                  <td className="min-w-[240px] px-4 py-3 leading-6 text-slate-200">{translateIssue(gap.issue)}</td>
                  <td className="min-w-[360px] px-4 py-3 leading-6 text-slate-300">
                    {translateRecommendation(gap.recommendedAction)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="rounded-full border border-red-400/30 bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-100">
                      {gap.priority}
                    </span>
                  </td>
                </tr>
              ))}

            {!isLoading && gaps.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={6}>
                  No priority gaps are available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

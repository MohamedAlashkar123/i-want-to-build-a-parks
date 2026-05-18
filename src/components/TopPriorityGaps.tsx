import { ListChecks } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ParkRecord } from '../types/park';
import { generateGapAnalysis, type GapAnalysisRecord } from '../utils/gapAnalysis';
import CollapsibleSection from './CollapsibleSection';

type TopPriorityGapsProps = {
  parks: ParkRecord[];
  isLoading?: boolean;
};

type MunicipalityFilter = 'All' | 'ADM' | 'AAM' | 'DRM';
type GapTypeFilter = 'All' | 'CCTV' | 'GIS' | 'Integration Not Confirmed';
type PriorityFilter = 'All' | 'High' | 'Medium' | 'Low';

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
    'حالة الربط مع أنظمة DMT غير مؤكدة': 'DMT integration status is not confirmed',
  };

  return issueMap[issue] || issue;
}

function displayGapCategory(gapCategory: string): string {
  return gapCategory === 'Integration' ? 'Integration Not Confirmed' : gapCategory;
}

function requiredActionForGap(gap: GapAnalysisRecord): string {
  if (gap.gapCategory === 'CCTV') {
    return 'Assess CCTV need';
  }

  if (gap.gapCategory === 'GIS') {
    return 'Validate GIS location';
  }

  if (gap.gapCategory === 'Integration') {
    return 'Confirm integration status';
  }

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
    'تأكيد حالة الربط مع أنظمة DMT في دورة التحقق القادمة':
      'Confirm DMT integration status in the next data validation cycle.',
  };

  return recommendationMap[gap.recommendedAction] || gap.recommendedAction;
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
  const [gapType, setGapType] = useState<GapTypeFilter>('All');
  const [priority, setPriority] = useState<PriorityFilter>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showGuidance, setShowGuidance] = useState(false);
  const [showFullTable, setShowFullTable] = useState(false);
  const [showTable, setShowTable] = useState(true);
  const smartParkSourceRows = useMemo(
    () => new Set(parks.filter((park) => park.isSmartPark).map((park) => `${park.sourceSheet}-${park.sourceRowNumber}`)),
    [parks],
  );
  const allGaps = useMemo(
    () =>
      generateGapAnalysis(parks).filter(
        (gap) => !(gap.gapCategory === 'Integration' && smartParkSourceRows.has(`${gap.sourceSheet}-${gap.sourceRowNumber}`)),
      ),
    [parks, smartParkSourceRows],
  );
  const filteredGaps = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    return allGaps.filter((gap) => {
      const gapTypeMatches =
        gapType === 'All' ||
        gap.gapCategory === gapType ||
        (gapType === 'Integration Not Confirmed' && gap.gapCategory === 'Integration');
      const priorityMatches = priority === 'All' || gap.priority === priority;
      const searchMatches = !normalizedSearchTerm || gap.parkName.toLowerCase().includes(normalizedSearchTerm);

      return (municipality === 'All' || gap.municipality === municipality) && gapTypeMatches && priorityMatches && searchMatches;
    });
  }, [allGaps, gapType, municipality, priority, searchTerm]);
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
    ['High Priority', highPriorityCount],
    ['CCTV Missing', cctvGapsCount],
    ['GIS Pending', gisGapsCount],
    ['Integration Not Confirmed', integrationGapsCount],
  ];
  const visibleGaps = showFullTable ? gaps : gaps.slice(0, 5);

  return (
    <CollapsibleSection
      title="Priority Improvement Actions"
      subtitle="Highest-priority actions generated from the current inventory for executive follow-up."
      defaultOpen
      hideToggle
      actions={
        <>
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
          <label className="flex items-center gap-2 text-sm text-slate-300">
            Gap Type
            <select
              className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-300/50"
              value={gapType}
              onChange={(event) => setGapType(event.target.value as GapTypeFilter)}
            >
              <option value="All">All</option>
              <option value="CCTV">CCTV</option>
              <option value="GIS">GIS</option>
              <option value="Integration Not Confirmed">Integration Not Confirmed</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            Priority
            <select
              className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-300/50"
              value={priority}
              onChange={(event) => setPriority(event.target.value as PriorityFilter)}
            >
              <option value="All">All</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </label>
          <input
            className="min-w-[180px] rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-cyan-300/50"
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search park name"
            aria-label="Search by park name"
          />
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-300/20 bg-amber-300/10 text-amber-100">
            <ListChecks className="h-5 w-5" aria-hidden="true" />
          </span>
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-cyan-300/40 hover:text-white"
            type="button"
            onClick={() => {
              if (showFullTable) {
                setShowTable(false);
                setShowFullTable(false);
              } else {
                setShowTable(true);
                setShowFullTable(true);
              }
            }}
          >
            {showFullTable ? 'Hide table' : 'Show full table'}
          </button>
        </>
      }
      summaryContent={
        <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryItems.map(([label, value]) => (
          <article key={label} className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
            <p className="truncate text-xs text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-white">{isLoading ? '-' : value}</p>
          </article>
        ))}
      </div>

      <p className="mt-4 rounded-xl border border-cyan-300/15 bg-cyan-300/10 px-4 py-3 text-sm leading-6 text-cyan-50">
        Actions are generated from the current inventory and can be filtered by municipality and gap type.
      </p>

      <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/60 p-3">
        <button
          className="flex w-full items-center justify-between gap-3 text-left text-sm font-semibold text-white"
          type="button"
          onClick={() => setShowGuidance((current) => !current)}
          aria-expanded={showGuidance}
        >
          Action Guidance
          <span className="text-xs text-slate-400">{showGuidance ? 'Hide' : 'Show'}</span>
        </button>
        {showGuidance && (
          <div className="mt-3 grid gap-2 text-xs leading-5 text-slate-300 lg:grid-cols-3">
            <p>
              <span className="font-semibold text-cyan-100">CCTV:</span> Assess CCTV installation priority based on
              park size, location, visitor volume, and security needs.
            </p>
            <p>
              <span className="font-semibold text-cyan-100">GIS:</span> Validate park coordinates and update GIS
              location data for accurate map visualization.
            </p>
            <p>
              <span className="font-semibold text-cyan-100">Integration:</span> Confirm DMT integration status for the
              park in the next data validation cycle.
            </p>
          </div>
        )}
      </div>
        </>
      }
    >
      {showTable && (
      <>
      <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/50 px-4 py-2 text-xs text-slate-400">
        <span>
          Showing {visibleGaps.length} of {allGaps.length} actions
        </span>
        <span>{filteredGaps.length} actions after filtering</span>
      </div>
      <div className="max-w-full overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[980px] border-collapse text-left text-sm">
          <thead className="bg-slate-950 text-slate-300">
            <tr>
              <th className="whitespace-nowrap px-4 py-3 font-semibold">Municipality</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold">Park</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold">Gap Type</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold">Issue</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold">Required Action</th>
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
              visibleGaps.map((gap) => (
                <tr key={gap.id} className="align-top hover:bg-white/[0.03]">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-100">{gap.municipality}</td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-slate-100" title={gap.parkName}>
                    {gap.parkName}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-300">{displayGapCategory(gap.gapCategory)}</td>
                  <td className="min-w-[240px] px-4 py-3 leading-6 text-slate-200">{translateIssue(gap.issue)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-300">
                    {requiredActionForGap(gap)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="rounded-full border border-red-400/30 bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-100">
                      {gap.priority}
                    </span>
                  </td>
                </tr>
              ))}

            {!isLoading && visibleGaps.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={6}>
                  No priority gaps are available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </>
      )}
    </CollapsibleSection>
  );
}

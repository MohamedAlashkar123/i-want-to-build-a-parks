import { useEffect, useState } from 'react';
import ChartsPanel from './components/ChartsPanel';
import ExecutiveMapboxMap from './components/ExecutiveMapboxMap';
import ExecutiveSidePanel from './components/ExecutiveSidePanel';
import GisConversionReadiness from './components/GisConversionReadiness';
import Header from './components/Header';
import MunicipalitySummaryTable from './components/MunicipalitySummaryTable';
import SmartParksByMunicipalityCard from './components/SmartParksByMunicipalityCard';
import TopPriorityGaps from './components/TopPriorityGaps';
import { loadNormalizedParks } from './data/normalizeParks';
import type { ParkRecord } from './types/park';

type NormalizedParksState = {
  isLoading: boolean;
  parks: ParkRecord[];
};

export default function App() {
  const [normalizedParksState, setNormalizedParksState] = useState<NormalizedParksState>({
    isLoading: true,
    parks: [],
  });

  useEffect(() => {
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = 'en';
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadParks() {
      try {
        const parks = await loadNormalizedParks();

        if (isMounted) {
          setNormalizedParksState({ isLoading: false, parks });
        }
      } catch {
        if (isMounted) {
          setNormalizedParksState({ isLoading: false, parks: [] });
        }
      }
    }

    loadParks();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-slate-100 lg:p-5">
      <div className="mx-auto max-w-[1680px] space-y-4">
        <Header />

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(280px,1fr)]">
          <ExecutiveMapboxMap parks={normalizedParksState.parks} />
          <ExecutiveSidePanel parks={normalizedParksState.parks} isLoading={normalizedParksState.isLoading} />
        </section>

        <ChartsPanel parks={normalizedParksState.parks} />

        <SmartParksByMunicipalityCard parks={normalizedParksState.parks} isLoading={normalizedParksState.isLoading} />

        <MunicipalitySummaryTable parks={normalizedParksState.parks} isLoading={normalizedParksState.isLoading} />

        <GisConversionReadiness parks={normalizedParksState.parks} isLoading={normalizedParksState.isLoading} />

        <TopPriorityGaps parks={normalizedParksState.parks} isLoading={normalizedParksState.isLoading} />
      </div>
    </main>
  );
}

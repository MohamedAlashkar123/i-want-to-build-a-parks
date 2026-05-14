import { useEffect, useState } from 'react';
import CamerasByMunicipalityChart from './components/CamerasByMunicipalityChart';
import CctvAvailabilityByMunicipalityChart from './components/CctvAvailabilityByMunicipalityChart';
import CctvStatusChart from './components/CctvStatusChart';
import ExecutiveMapboxMap from './components/ExecutiveMapboxMap';
import ExecutiveInsightsRow from './components/ExecutiveInsightsRow';
import GisDataQualityChart from './components/GisDataQualityChart';
import GisConversionReadiness from './components/GisConversionReadiness';
import Header from './components/Header';
import KpiCards from './components/KpiCards';
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

        <KpiCards parks={normalizedParksState.parks} isLoading={normalizedParksState.isLoading} />

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-[320px_minmax(0,1fr)_320px]">
          <div className="order-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:order-2 2xl:order-1 2xl:grid-cols-1">
            <CctvStatusChart parks={normalizedParksState.parks} />
            <CctvAvailabilityByMunicipalityChart parks={normalizedParksState.parks} />
          </div>

          <div className="order-1 lg:col-span-2 2xl:order-2 2xl:col-span-1">
            <ExecutiveMapboxMap parks={normalizedParksState.parks} />
          </div>

          <div className="order-3 grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-1">
            <CamerasByMunicipalityChart parks={normalizedParksState.parks} />
            <GisDataQualityChart parks={normalizedParksState.parks} />
          </div>
        </section>

        <ExecutiveInsightsRow parks={normalizedParksState.parks} />

        <SmartParksByMunicipalityCard parks={normalizedParksState.parks} isLoading={normalizedParksState.isLoading} />

        <MunicipalitySummaryTable parks={normalizedParksState.parks} isLoading={normalizedParksState.isLoading} />

        <TopPriorityGaps parks={normalizedParksState.parks} isLoading={normalizedParksState.isLoading} />

        <GisConversionReadiness parks={normalizedParksState.parks} isLoading={normalizedParksState.isLoading} />
      </div>
    </main>
  );
}

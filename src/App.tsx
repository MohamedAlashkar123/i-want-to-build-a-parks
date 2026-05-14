import { motion, useReducedMotion } from 'framer-motion';
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
  const shouldReduceMotion = useReducedMotion();
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
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Header />
        </motion.div>

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
        >
          <KpiCards parks={normalizedParksState.parks} isLoading={normalizedParksState.isLoading} />
        </motion.div>

        <motion.section
          className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-[320px_minmax(0,1fr)_320px]"
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
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
        </motion.section>

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45 }}
        >
          <ExecutiveInsightsRow parks={normalizedParksState.parks} />
        </motion.div>

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.18 }}
          transition={{ duration: 0.45 }}
        >
          <SmartParksByMunicipalityCard parks={normalizedParksState.parks} isLoading={normalizedParksState.isLoading} />
        </motion.div>

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.14 }}
          transition={{ duration: 0.45 }}
        >
          <MunicipalitySummaryTable parks={normalizedParksState.parks} isLoading={normalizedParksState.isLoading} />
        </motion.div>

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.14 }}
          transition={{ duration: 0.45 }}
        >
          <TopPriorityGaps parks={normalizedParksState.parks} isLoading={normalizedParksState.isLoading} />
        </motion.div>

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.14 }}
          transition={{ duration: 0.45 }}
        >
          <GisConversionReadiness parks={normalizedParksState.parks} isLoading={normalizedParksState.isLoading} />
        </motion.div>
      </div>
    </main>
  );
}

import type { ParkRecord } from '../types/park';
import CamerasByMunicipalityChart from './CamerasByMunicipalityChart';
import CctvAvailabilityByMunicipalityChart from './CctvAvailabilityByMunicipalityChart';
import CctvStatusChart from './CctvStatusChart';
import GisDataQualityChart from './GisDataQualityChart';

type ChartsPanelProps = {
  parks: ParkRecord[];
};

export default function ChartsPanel({ parks }: ChartsPanelProps) {
  return (
    <section className="grid max-w-full grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-4">
      <CctvStatusChart parks={parks} />
      <CctvAvailabilityByMunicipalityChart parks={parks} />
      <CamerasByMunicipalityChart parks={parks} />
      <GisDataQualityChart parks={parks} />
    </section>
  );
}

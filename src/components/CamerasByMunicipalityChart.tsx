import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ParkRecord } from '../types/park';
import { getCamerasByMunicipalityChartData } from '../utils/dashboardCalculations';
import ChartCard from './charts/ChartCard';
import EmptyChartMessage from './charts/EmptyChartMessage';
import { chartTooltipStyle } from './charts/chartStyles';

type CamerasByMunicipalityChartProps = {
  parks: ParkRecord[];
};

export default function CamerasByMunicipalityChart({ parks }: CamerasByMunicipalityChartProps) {
  const data = getCamerasByMunicipalityChartData(parks);
  const hasData = data.some((item) => item.value > 0);

  return (
    <ChartCard title="Cameras by Municipality" subtitle="Total recorded CCTV cameras across ADM, AAM, and DRM.">
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="rgba(148, 163, 184, 0.16)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#cbd5e1', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#cbd5e1', fontSize: 12 }} axisLine={false} tickLine={false} width={44} />
            <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="value" name="Total Cameras" fill="#38bdf8" radius={[8, 8, 0, 0]} isAnimationActive animationDuration={700} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <EmptyChartMessage />
      )}
    </ChartCard>
  );
}

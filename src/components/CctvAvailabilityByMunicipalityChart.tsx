import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ParkRecord } from '../types/park';
import { getCctvAvailabilityByMunicipalityChartData } from '../utils/dashboardCalculations';
import ChartCard from './charts/ChartCard';
import EmptyChartMessage from './charts/EmptyChartMessage';
import { chartLegendStyle, chartTooltipStyle } from './charts/chartStyles';

type CctvAvailabilityByMunicipalityChartProps = {
  parks: ParkRecord[];
};

export default function CctvAvailabilityByMunicipalityChart({ parks }: CctvAvailabilityByMunicipalityChartProps) {
  const data = getCctvAvailabilityByMunicipalityChartData(parks);
  const hasData = data.some((item) => item.withCctv + item.withoutCctv + item.unknownCctv > 0);

  return (
    <ChartCard
      title="CCTV Availability by Municipality"
      subtitle="Compares park-level CCTV status across ADM, AAM, and DRM."
    >
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="rgba(148, 163, 184, 0.16)" vertical={false} />
            <XAxis dataKey="municipality" tick={{ fill: '#cbd5e1', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#cbd5e1', fontSize: 12 }} axisLine={false} tickLine={false} width={44} />
            <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Legend wrapperStyle={chartLegendStyle} />
            <Bar dataKey="withCctv" name="With CCTV" fill="#22c55e" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={700} />
            <Bar dataKey="withoutCctv" name="Without CCTV" fill="#ef4444" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={700} />
            <Bar dataKey="unknownCctv" name="Unknown" fill="#94a3b8" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={700} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <EmptyChartMessage />
      )}
    </ChartCard>
  );
}

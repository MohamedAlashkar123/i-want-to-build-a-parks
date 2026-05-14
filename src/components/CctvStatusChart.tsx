import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { ParkRecord } from '../types/park';
import { getCctvStatusChartData } from '../utils/dashboardCalculations';
import ChartCard from './charts/ChartCard';
import EmptyChartMessage from './charts/EmptyChartMessage';
import { chartLegendStyle, chartTooltipStyle } from './charts/chartStyles';

type CctvStatusChartProps = {
  parks: ParkRecord[];
};

const colors: Record<string, string> = {
  'Parks with CCTV': '#22c55e',
  'Parks without CCTV': '#ef4444',
  'Unknown CCTV status': '#94a3b8',
};

export default function CctvStatusChart({ parks }: CctvStatusChartProps) {
  const data = getCctvStatusChartData(parks);
  const hasData = data.some((item) => item.value > 0);

  return (
    <ChartCard
      title="CCTV Status by Parks"
      subtitle="Park records grouped by CCTV availability status."
      note="Park-level CCTV availability, not physical coverage."
    >
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="58%"
              outerRadius="82%"
              paddingAngle={3}
              isAnimationActive
              animationDuration={700}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={colors[entry.name]} />
              ))}
            </Pie>
            <Tooltip contentStyle={chartTooltipStyle} itemStyle={{ color: '#e2e8f0' }} />
            <Legend wrapperStyle={chartLegendStyle} />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <EmptyChartMessage />
      )}
    </ChartCard>
  );
}

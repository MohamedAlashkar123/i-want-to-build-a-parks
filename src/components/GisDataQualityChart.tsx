import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { ParkRecord } from '../types/park';
import { getGisDataQualityChartData } from '../utils/dashboardCalculations';
import ChartCard from './charts/ChartCard';
import EmptyChartMessage from './charts/EmptyChartMessage';
import { chartLegendStyle, chartTooltipStyle } from './charts/chartStyles';

type GisDataQualityChartProps = {
  parks: ParkRecord[];
};

const colors: Record<string, string> = {
  'Ready for Map': '#22c55e',
  'Extracted from Google Maps': '#38bdf8',
  'Projected X/Y Pending CRS': '#f59e0b',
  'Missing or Invalid GIS': '#ef4444',
};

export default function GisDataQualityChart({ parks }: GisDataQualityChartProps) {
  const data = getGisDataQualityChartData(parks);
  const hasData = data.some((item) => item.value > 0);

  return (
    <ChartCard
      title="GIS Data Quality"
      subtitle="Coordinate readiness for executive map plotting."
      note="Projected X/Y requires CRS/EPSG confirmation before conversion."
    >
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="80%" paddingAngle={3}>
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

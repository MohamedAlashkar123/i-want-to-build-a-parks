import type { ParkRecord } from '../types/park';

type MapSummaryCardsProps = {
  parks: ParkRecord[];
  isLoading?: boolean;
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function hasValidCoordinates(park: ParkRecord): boolean {
  return (
    typeof park.latitude === 'number' &&
    typeof park.longitude === 'number' &&
    Number.isFinite(park.latitude) &&
    Number.isFinite(park.longitude) &&
    park.latitude >= -90 &&
    park.latitude <= 90 &&
    park.longitude >= -180 &&
    park.longitude <= 180
  );
}

export default function MapSummaryCards({ parks, isLoading = false }: MapSummaryCardsProps) {
  const items = [
    ['سجلات بإحداثيات صالحة', parks.filter(hasValidCoordinates).length],
    ['سجلات بدون إحداثيات صالحة', parks.filter((park) => !hasValidCoordinates(park)).length],
    ['إحداثيات من Google Maps', parks.filter((park) => park.coordinateSource === 'Google Maps').length],
    ['إحداثيات X/Y تحتاج تحويل', parks.filter((park) => park.coordinateSource === 'Projected XY').length],
  ];

  return (
    <section className="grid max-w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map(([label, value]) => (
        <article key={label} className="min-w-0 rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/20">
          <p className="truncate text-sm text-slate-400" title={String(label)}>
            {label}
          </p>
          <p className="mt-3 text-3xl font-bold text-white">{isLoading ? '-' : formatNumber(Number(value))}</p>
        </article>
      ))}
    </section>
  );
}

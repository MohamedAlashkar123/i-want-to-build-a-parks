import type { ReactNode } from 'react';

type ChartCardProps = {
  title: string;
  subtitle: string;
  note?: string;
  children: ReactNode;
};

export default function ChartCard({ title, subtitle, note, children }: ChartCardProps) {
  return (
    <article className="min-h-[350px] overflow-hidden rounded-2xl border border-white/10 bg-slate-900/75 p-5 shadow-xl shadow-black/20">
      <div className="mb-4">
        <h2 className="truncate text-lg font-semibold text-white">{title}</h2>
        <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-400">{subtitle}</p>
      </div>
      <div className="h-64 min-w-0">{children}</div>
      {note && (
        <p className="mt-4 rounded-xl border border-cyan-400/15 bg-cyan-400/10 px-4 py-2.5 text-xs leading-6 text-cyan-50">
          {note}
        </p>
      )}
    </article>
  );
}

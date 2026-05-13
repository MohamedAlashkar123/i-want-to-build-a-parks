import { ShieldCheck } from 'lucide-react';

export default function Header() {
  return (
    <header className="max-w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 shadow-xl shadow-black/20">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-normal text-white lg:text-2xl">
            Parks CCTV & Smart Parks Executive Dashboard
          </h1>
          <p className="mt-0.5 truncate text-xs text-slate-300 lg:text-sm">
            Executive overview of CCTV availability, GIS readiness, confirmed smart parks, and priority gaps.
          </p>
        </div>
      </div>
    </header>
  );
}

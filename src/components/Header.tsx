import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const [logoSource, setLogoSource] = useState('/dmt-logo.png');
  const [showLogo, setShowLogo] = useState(true);

  return (
    <header className="max-w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 shadow-xl shadow-black/20">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold tracking-normal text-white lg:text-2xl">
              Parks CCTV & Smart Parks Executive Dashboard
            </h1>
            <p className="mt-0.5 truncate text-xs text-slate-300 lg:text-sm">
              CCTV availability, GIS readiness, confirmed smart parks, and priority gaps across public parks.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          {['Executive Dashboard', 'DMT Smart Parks: Integrated'].map((badge) => (
            <span
              key={badge}
              className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1 text-[11px] font-semibold text-cyan-50"
            >
              {badge}
            </span>
          ))}
          {showLogo && (
            <span className="flex min-w-[180px] shrink-0 items-center justify-end sm:min-w-[220px] lg:min-w-[260px]">
              <img
                className="h-12 w-auto max-w-full rounded-md object-contain sm:h-14 lg:h-16"
                src={logoSource}
                alt="DMT"
                onError={() => {
                  if (logoSource.endsWith('.png')) {
                    setLogoSource('/dmt-logo.svg');
                  } else {
                    setShowLogo(false);
                  }
                }}
              />
            </span>
          )}
        </div>
      </div>
    </header>
  );
}

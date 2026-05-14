import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const [logoSource, setLogoSource] = useState('/dmt-logo.png');
  const [showLogo, setShowLogo] = useState(true);

  return (
    <header className="max-w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900/85 px-4 py-4 shadow-xl shadow-black/20 sm:px-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold leading-tight tracking-normal text-white lg:text-2xl">
              Public Parks Surveillance & Smart Readiness Dashboard
            </h1>
            <p className="mt-1 max-w-4xl text-sm leading-5 text-slate-300">
              Executive view of CCTV availability, smart park capabilities, GIS readiness, and priority improvement areas.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center sm:justify-end">
          {showLogo && (
            <span className="flex w-[180px] shrink-0 items-center justify-start sm:w-[220px] sm:justify-end lg:w-[260px] xl:w-[280px]">
              <img
                className="max-h-16 w-full max-w-full rounded-md object-contain sm:max-h-[68px] lg:max-h-[72px]"
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

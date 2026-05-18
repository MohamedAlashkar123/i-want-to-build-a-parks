import { Database } from 'lucide-react';

export default function DataNotesCard() {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-4 shadow-xl shadow-black/20">
      <div className="mb-3 flex items-center gap-2">
        <Database className="h-4 w-4 text-cyan-100" aria-hidden="true" />
        <h2 className="text-base font-semibold text-white">Data Notes</h2>
      </div>
      <ul className="grid list-disc gap-x-8 gap-y-1.5 pl-4 text-xs leading-5 text-slate-300 marker:text-cyan-300 md:grid-cols-2">
        <li>Park locations are enriched using the GIS Geodatabase provided by the GIS team.</li>
        <li>CCTV availability and camera counts are based on the CCTV inventory Excel.</li>
        <li>Confirmed smart parks are based on project-team confirmation.</li>
        <li>AI visitor counting data is available for 5 of the 6 confirmed smart parks.</li>
        <li>Corniche Beach is a confirmed smart park and is integrated with DMT systems, but it has no CCTV visitor counting cameras.</li>
        <li>Operational camera status and actual physical camera coverage percentage are not available in the current dataset.</li>
      </ul>
    </section>
  );
}

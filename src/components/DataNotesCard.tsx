import { Database } from 'lucide-react';

export default function DataNotesCard() {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-4 shadow-xl shadow-black/20">
      <div className="mb-3 flex items-center gap-2">
        <Database className="h-4 w-4 text-cyan-100" aria-hidden="true" />
        <h2 className="text-base font-semibold text-white">Data Notes & Limitations</h2>
      </div>
      <ul className="grid list-disc gap-x-8 gap-y-1.5 pl-4 text-xs leading-5 text-slate-300 marker:text-cyan-300 md:grid-cols-2">
        <li>Confirmed smart parks are based on project-team confirmation and provided coordinates.</li>
        <li>AI visitor counting camera data is available for 5 of the 6 confirmed smart parks.</li>
        <li>Corniche Beach is a confirmed smart park and is integrated with DMT systems, but it has no CCTV visitor counting cameras.</li>
        <li>No crowd detection, vandalism detection, facial recognition, or other AI capabilities are included.</li>
        <li>No operational camera status or actual coverage percentage is available.</li>
        <li>Available X/Y coordinates are converted for map visualization using UTM Zone 40N and remain subject to final GIS validation.</li>
        <li>Projected X/Y records outside validation ranges remain pending review before map display.</li>
        <li>English park names are missing from the current Excel dataset.</li>
      </ul>
    </section>
  );
}

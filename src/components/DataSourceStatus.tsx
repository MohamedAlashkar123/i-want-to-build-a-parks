import { useEffect, useState } from 'react';
import { excelFileName, loadExcelSummary, type ExcelSheetSummary } from '../data/loadExcel';
import type { TranslationDictionary } from '../i18n/translations';

const missingFileMessage = 'تعذر تحميل ملف البيانات. يرجى التأكد من وجود الملف داخل مجلد public.';

type LoadState = {
  status: 'loading' | 'success' | 'error';
  sheets: ExcelSheetSummary[];
  errorMessage?: string;
};

type DataSourceStatusProps = {
  t: TranslationDictionary;
};

export default function DataSourceStatus({ t }: DataSourceStatusProps) {
  const [loadState, setLoadState] = useState<LoadState>({
    status: 'loading',
    sheets: [],
  });

  useEffect(() => {
    let isMounted = true;

    async function readExcelFile() {
      try {
        const sheets = await loadExcelSummary();

        if (isMounted) {
          setLoadState({ status: 'success', sheets });
        }
      } catch (error) {
        if (isMounted) {
          setLoadState({
            status: 'error',
            sheets: [],
            errorMessage: error instanceof Error ? error.message : missingFileMessage,
          });
        }
      }
    }

    readExcelFile();

    return () => {
      isMounted = false;
    };
  }, []);

  const worksheetCount = loadState.sheets.length;

  return (
    <section className="max-w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/20">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-300">{t.dataSourceEyebrow}</p>
          <h2 className="mt-1 text-xl font-semibold text-white">{t.excelLoadStatus}</h2>
        </div>

        <span className="w-fit shrink-0 rounded-full border border-white/10 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-200">
          {loadState.status === 'loading' && t.loading}
          {loadState.status === 'success' && t.loaded}
          {loadState.status === 'error' && t.loadFailed}
        </span>
      </div>

      <div className="mt-5 grid max-w-full grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="min-w-0 rounded-xl border border-white/10 bg-slate-950/70 p-4">
          <p className="text-sm text-slate-400">{t.fileName}</p>
          <p className="mt-2 truncate text-base font-semibold text-slate-100" title={excelFileName}>
            {excelFileName}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-950/70 p-4">
          <p className="text-sm text-slate-400">{t.worksheetCount}</p>
          <p className="mt-2 text-base font-semibold text-slate-100">
            {loadState.status === 'success' ? worksheetCount : t.waitingForFileRead}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-950/70 p-4">
          <p className="text-sm text-slate-400">{t.status}</p>
          <p className="mt-2 text-base font-semibold text-slate-100">
            {loadState.status === 'loading' && t.readingFile}
            {loadState.status === 'success' && t.readyForValidation}
            {loadState.status === 'error' && t.dataSourceError}
          </p>
        </div>
      </div>

      {loadState.status === 'error' && (
        <div className="mt-4 rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-base leading-8 text-red-100">
          {loadState.errorMessage || missingFileMessage}
        </div>
      )}

      {loadState.status === 'success' && (
        <div className="mt-4 grid max-w-full grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {loadState.sheets.map((sheet) => (
            <article key={sheet.sheetName} className="min-w-0 rounded-xl border border-white/10 bg-slate-950/60 p-4">
              <p className="truncate text-base font-semibold text-white" title={sheet.sheetName}>
                {sheet.sheetName}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-slate-900 px-3 py-2">
                  <p className="text-slate-500">{t.rows}</p>
                  <p className="mt-1 font-semibold text-slate-200">{sheet.rowCount}</p>
                </div>
                <div className="rounded-lg bg-slate-900 px-3 py-2">
                  <p className="text-slate-500">{t.columns}</p>
                  <p className="mt-1 font-semibold text-slate-200">{sheet.columnCount}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

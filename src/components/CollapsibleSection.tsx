import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { type ReactNode, useState } from 'react';

type CollapsibleSectionProps = {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: ReactNode;
  summaryContent?: ReactNode;
  actions?: ReactNode;
  showText?: string;
  hideText?: string;
  hideToggle?: boolean;
};

export default function CollapsibleSection({
  title,
  subtitle,
  defaultOpen = true,
  children,
  summaryContent,
  actions,
  showText = 'Show table',
  hideText = 'Hide table',
  hideToggle = false,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="max-w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900/75 p-5 shadow-xl shadow-black/20">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          {subtitle && <p className="mt-1 text-sm leading-6 text-slate-400">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
          {!hideToggle && (
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-cyan-300/40 hover:text-white"
              type="button"
              onClick={() => setIsOpen((current) => !current)}
              aria-expanded={isOpen}
            >
              <motion.span animate={shouldReduceMotion ? undefined : { rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.18 }}>
                {isOpen ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
              </motion.span>
              {isOpen ? hideText : showText}
            </button>
          )}
        </div>
      </div>

      {summaryContent}

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            className="mt-4 overflow-hidden"
            initial={shouldReduceMotion ? false : { height: 0, opacity: 0 }}
            animate={shouldReduceMotion ? undefined : { height: 'auto', opacity: 1 }}
            exit={shouldReduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

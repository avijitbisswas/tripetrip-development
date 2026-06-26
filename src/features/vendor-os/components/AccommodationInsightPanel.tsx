import type { AccommodationModuleInsight } from '../accommodationModuleInsights';

interface AccommodationInsightPanelProps {
  insight: AccommodationModuleInsight | null;
}

export function AccommodationInsightPanel({ insight }: AccommodationInsightPanelProps) {
  if (!insight) return null;

  return (
    <section className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-700">{insight.title}</div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{insight.summary}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {insight.items.map((item) => (
            <div key={item.label} className="min-w-[150px] rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-indigo-100">
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{item.label}</div>
              <div className="mt-2 text-sm font-black text-slate-950">{item.status}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

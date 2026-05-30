import type { ReportData } from '../types';

function formatDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function Header({ meta }: { meta: ReportData['meta'] }) {
  return (
    <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-8 py-10 text-white shadow-xl">
      <div className="absolute -right-8 -top-8 text-[8rem] opacity-10 select-none">💩</div>
      <p className="text-sm font-medium uppercase tracking-widest text-amber-400">
        Report Mensile
      </p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight md:text-5xl">
        Gruppo 💩
      </h1>
      <p className="mt-3 max-w-2xl text-slate-300">
        Statistiche ufficiali dal {formatDate(meta.periodStart)} al{' '}
        {formatDate(meta.periodEnd)}
      </p>
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatPill label="Totale 💩" value={String(meta.totalVisits)} />
        <StatPill label="Giorni" value={String(meta.totalDays)} />
        <StatPill label="Media/giorno" value={String(meta.dailyAverage)} />
        <StatPill label="Partecipanti" value="8" />
      </div>
    </header>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

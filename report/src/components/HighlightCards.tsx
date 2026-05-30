import type { MemberMap, ReportData } from '../types';
import { MemberAvatar } from './MemberAvatar';

interface HighlightCardsProps {
  highlights: ReportData['highlights'];
  members: MemberMap;
}

function formatDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
  });
}

export function HighlightCards({ highlights, members }: HighlightCardsProps) {
  const cards = [
    {
      icon: '🔥',
      title: 'Record giornaliero',
      highlight: highlights.singleDayRecord,
      render: (h: typeof highlights.singleDayRecord) => (
        <>
          <span className="text-3xl font-bold">{h.count}</span>
          <span className="text-slate-500"> 💩 in un giorno</span>
          <p className="mt-1 text-sm text-slate-500">{formatDate(h.date)}</p>
        </>
      ),
    },
    {
      icon: '📅',
      title: 'Streak attiva più lunga',
      highlight: highlights.longestVisitStreak,
      render: (h: typeof highlights.longestVisitStreak) => (
        <>
          <span className="text-3xl font-bold">{h.days}</span>
          <span className="text-slate-500"> giorni consecutivi</span>
          {h.from && h.to && (
            <p className="mt-1 text-sm text-slate-500">
              {formatDate(h.from)} → {formatDate(h.to)}
            </p>
          )}
        </>
      ),
    },
    {
      icon: '🏜️',
      title: 'Streak a secco più lunga',
      highlight: highlights.longestDryStreak,
      render: (h: typeof highlights.longestDryStreak) => (
        <>
          <span className="text-3xl font-bold">{h.days}</span>
          <span className="text-slate-500"> giorni senza 💩</span>
          {h.from && h.to && (
            <p className="mt-1 text-sm text-slate-500">
              {formatDate(h.from)} → {formatDate(h.to)}
            </p>
          )}
        </>
      ),
    },
    {
      icon: '🚀',
      title: 'Miglior recupero',
      highlight: highlights.bestComeback,
      render: (h: typeof highlights.bestComeback) => (
        <>
          <span className="text-3xl font-bold">+{h.positionsGained}</span>
          <span className="text-slate-500"> posizioni</span>
          <p className="mt-1 text-sm text-slate-500">
            {h.rankAtMidpoint}° a metà mese → {h.finalRank}° finale
          </p>
        </>
      ),
    },
  ];

  return (
    <section>
      <h2 className="mb-4 text-xl font-bold text-slate-900">Record speciali</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const memberId =
            'memberId' in card.highlight ? card.highlight.memberId : '';
          const member = members[memberId];
          return (
            <article
              key={card.title}
              className="rounded-2xl bg-white p-5 shadow-lg ring-1 ring-slate-200"
            >
              <div className="flex items-start justify-between">
                <span className="text-2xl">{card.icon}</span>
                {member && <MemberAvatar member={member} size="sm" />}
              </div>
              <h3 className="mt-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                {card.title}
              </h3>
              {member && (
                <p className="mt-1 font-semibold text-slate-800">{member.displayName}</p>
              )}
              <div className="mt-3 text-slate-800">
                {card.render(card.highlight as never)}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

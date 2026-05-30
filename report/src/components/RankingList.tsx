import type { MemberMap, RankingEntry } from '../types';
import { MemberAvatar } from './MemberAvatar';

interface RankingListProps {
  rest: RankingEntry[];
  members: MemberMap;
  thirdPlaceTotal: number;
}

export function RankingList({ rest, members, thirdPlaceTotal }: RankingListProps) {
  if (rest.length === 0) return null;

  return (
    <section className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
      <h2 className="text-xl font-bold text-slate-900">Resto della classifica</h2>
      <p className="mt-1 text-sm text-slate-500">Posizioni dal 4° posto in poi</p>
      <ul className="mt-6 space-y-3">
        {rest.map((entry) => {
          const member = members[entry.memberId];
          if (!member) return null;
          const gap = thirdPlaceTotal - entry.total;
          return (
            <li
              key={entry.memberId}
              className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
            >
              <span className="w-8 text-center text-lg font-bold text-slate-400">
                {entry.rank}°
              </span>
              <MemberAvatar member={member} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-800">{member.displayName}</p>
                <p className="text-xs text-slate-500">{entry.percentage}% del totale</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-slate-900">{entry.total}</p>
                {gap > 0 && (
                  <p className="text-xs text-slate-400">−{gap} dal podio</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

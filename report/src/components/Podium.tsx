import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Member, MemberMap, RankingEntry } from '../types';
import { MemberAvatar } from './MemberAvatar';

const PODIUM_ORDER = [1, 0, 2] as const;

const RANK_STYLE: Record<number, { medal: string; height: string; bg: string }> = {
  1: {
    medal: '🥇',
    height: 'h-48',
    bg: 'bg-gradient-to-t from-amber-600/30 to-amber-400/10 border-amber-400/40',
  },
  2: {
    medal: '🥈',
    height: 'h-36',
    bg: 'bg-gradient-to-t from-slate-400/30 to-slate-300/10 border-slate-300/40',
  },
  3: {
    medal: '🥉',
    height: 'h-28',
    bg: 'bg-gradient-to-t from-orange-700/30 to-orange-500/10 border-orange-500/40',
  },
};

interface PodiumProps {
  top3: RankingEntry[];
  members: MemberMap;
}

export function Podium({ top3, members }: PodiumProps) {
  const chartData = top3.map((entry) => ({
    name: members[entry.memberId]?.displayName ?? entry.memberId,
    total: entry.total,
    fill: members[entry.memberId]?.color ?? '#888',
  }));

  return (
    <section className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
      <h2 className="text-xl font-bold text-slate-900">Podio</h2>
      <p className="mt-1 text-sm text-slate-500">I tre campioni del mese</p>

      <div className="mt-8 flex items-end justify-center gap-3 md:gap-6">
        {PODIUM_ORDER.map((idx) => {
          const entry = top3[idx];
          if (!entry) return null;
          const member = members[entry.memberId];
          const style = RANK_STYLE[entry.rank];
          if (!member || !style) return null;
          return (
            <PodiumSlot
              key={entry.memberId}
              entry={entry}
              member={member}
              medal={style.medal}
              heightClass={style.height}
              bgClass={style.bg}
            />
          );
        })}
      </div>

      <div className="mt-10 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value) => [`${value} 💩`, 'Totale']}
              contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
            />
            <Bar dataKey="total" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function PodiumSlot({
  entry,
  member,
  medal,
  heightClass,
  bgClass,
}: {
  entry: RankingEntry;
  member?: Member;
  medal: string;
  heightClass: string;
  bgClass: string;
}) {
  if (!member) return null;
  return (
    <div className="flex w-28 flex-col items-center md:w-36">
      <span className="mb-2 text-3xl">{medal}</span>
      <MemberAvatar member={member} size="lg" showRing />
      <p className="mt-3 text-center text-sm font-semibold text-slate-800">
        {member.displayName.split(' ')[0]}
      </p>
      <p className="text-2xl font-bold text-slate-900">{entry.total}</p>
      <div
        className={`mt-3 flex w-full items-end justify-center rounded-t-xl border ${heightClass} ${bgClass}`}
      >
        <span className="mb-2 text-lg font-bold text-slate-600">{entry.rank}°</span>
      </div>
    </div>
  );
}

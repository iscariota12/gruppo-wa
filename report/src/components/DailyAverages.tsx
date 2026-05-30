import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DailyAverageEntry, MemberMap } from '../types';
import { MemberAvatar } from './MemberAvatar';

interface DailyAveragesProps {
  averages: DailyAverageEntry[];
  members: MemberMap;
  totalDays: number;
}

export function DailyAverages({ averages, members, totalDays }: DailyAveragesProps) {
  const chartData = averages.map((entry) => ({
    ...entry,
    name: members[entry.memberId]?.displayName ?? entry.memberId,
    color: members[entry.memberId]?.color ?? '#888',
  }));

  const groupAverage =
    Math.round(
      (averages.reduce((sum, e) => sum + e.dailyAverage, 0) / averages.length) * 100,
    ) / 100;

  return (
    <section className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
      <h2 className="text-xl font-bold text-slate-900">Medie giornaliere</h2>
      <p className="mt-1 text-sm text-slate-500">
        Media 💩 al giorno nel periodo ({totalDays} giorni di calendario)
      </p>

      <div className="mt-6 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
            <XAxis type="number" domain={[0, 'auto']} tick={{ fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              tick={{ fontSize: 11 }}
              tickFormatter={(v: string) => v.split(' ')[0]}
            />
            <Tooltip
              formatter={(value, _name, props) => {
                const p = props.payload as DailyAverageEntry & { name: string };
                return [
                  `${value} 💩/giorno (${p.total} totali, ${p.activeDays} giorni attivi)`,
                  'Media calendario',
                ];
              }}
              contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
            />
            <Bar dataKey="dailyAverage" radius={[0, 6, 6, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.memberId} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <ul className="mt-6 space-y-2">
        {averages.map((entry, idx) => {
          const member = members[entry.memberId];
          if (!member) return null;
          const aboveAvg = entry.dailyAverage >= groupAverage;
          return (
            <li
              key={entry.memberId}
              className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
            >
              <span className="w-6 text-center text-sm font-bold text-slate-400">{idx + 1}</span>
              <MemberAvatar member={member} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-800">{member.displayName}</p>
                <p className="text-xs text-slate-500">
                  {entry.activeDays} giorni attivi · {entry.dailyAverageActiveDays} 💩/giorno attivo
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-slate-900">{entry.dailyAverage}</p>
                <p className="text-xs text-slate-400">💩/giorno</p>
              </div>
              {aboveAvg && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  sopra media
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <p className="mt-4 text-center text-xs text-slate-400">
        Media del gruppo: {groupAverage} 💩/giorno per partecipante
      </p>
    </section>
  );
}

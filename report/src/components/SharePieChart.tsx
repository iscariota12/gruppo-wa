import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { MemberMap, RankingEntry } from '../types';
import { MemberAvatar } from './MemberAvatar';

interface SharePieChartProps {
  ranking: RankingEntry[];
  members: MemberMap;
}

export function SharePieChart({ ranking, members }: SharePieChartProps) {
  const data = ranking.map((entry) => ({
    name: members[entry.memberId]?.displayName ?? entry.memberId,
    value: entry.total,
    percentage: entry.percentage,
    color: members[entry.memberId]?.color ?? '#888',
    memberId: entry.memberId,
  }));

  return (
    <section className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
      <h2 className="text-xl font-bold text-slate-900">Distribuzione percentuale</h2>
      <p className="mt-1 text-sm text-slate-500">Quota di mercato del bagno 💩</p>

      <div className="mt-6 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={95}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
            >
              {data.map((entry) => (
                <Cell key={entry.memberId} fill={entry.color} stroke="#fff" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, _name, props) => {
                const pct = (props.payload as { percentage: number }).percentage;
                return [`${value} 💩 (${pct}%)`, 'Totale'];
              }}
              contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
            />
            <Legend
              formatter={(value) => (
                <span className="text-sm text-slate-700">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {data.map((entry) => {
          const member = members[entry.memberId];
          if (!member) return null;
          return (
            <div
              key={entry.memberId}
              className="flex items-center gap-2 rounded-lg bg-slate-50 px-2 py-2"
            >
              <MemberAvatar member={member} size="sm" />
              <div>
                <p className="text-xs font-medium text-slate-700">{member.displayName.split(' ')[0]}</p>
                <p className="text-xs text-slate-500">{entry.percentage}%</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MemberMap, TimelinePoint } from '../types';

interface CumulativeTimelineProps {
  timeline: TimelinePoint[];
  members: MemberMap;
}

function formatShortDate(iso: string) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
}

export function CumulativeTimeline({ timeline, members }: CumulativeTimelineProps) {
  const memberIds = useMemo(
    () => [...new Set(timeline.map((p) => p.memberId))],
    [timeline],
  );

  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const chartData = useMemo(() => {
    const byDate = new Map<string, Record<string, number | string>>();
    for (const point of timeline) {
      if (!byDate.has(point.date)) {
        byDate.set(point.date, { date: point.date });
      }
      const row = byDate.get(point.date)!;
      row[point.memberId] = point.cumulative;
    }
    return [...byDate.values()].sort((a, b) =>
      String(a.date).localeCompare(String(b.date)),
    );
  }, [timeline]);

  const toggle = (id: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <section className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
      <h2 className="text-xl font-bold text-slate-900">Andamento cumulativo</h2>
      <p className="mt-1 text-sm text-slate-500">
        Evoluzione del totale nel tempo — clicca la legenda per filtrare
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {memberIds.map((id) => {
          const member = members[id];
          if (!member) return null;
          const isHidden = hidden.has(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                isHidden
                  ? 'bg-slate-100 text-slate-400 line-through'
                  : 'text-white shadow-sm'
              }`}
              style={isHidden ? undefined : { backgroundColor: member.color }}
            >
              {member.displayName.split(' ')[0]}
            </button>
          );
        })}
      </div>

      <div className="mt-6 h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatShortDate}
              tick={{ fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip
              labelFormatter={(label) => formatShortDate(String(label))}
              contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
            />
            <Legend wrapperStyle={{ display: 'none' }} />
            {memberIds.map((id) => {
              const member = members[id];
              if (!member || hidden.has(id)) return null;
              return (
                <Line
                  key={id}
                  type="monotone"
                  dataKey={id}
                  name={member.displayName}
                  stroke={member.color}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

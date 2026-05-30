import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MemberMap, RankTimelinePoint } from '../types';

interface BumpChartProps {
  rankTimeline: RankTimelinePoint[];
  members: MemberMap;
  memberCount: number;
  provisionalRanks: Record<string, number>;
}

type ChartRow = {
  date: string;
  label: string;
  isProvisional?: boolean;
  [memberId: string]: number | string | boolean | undefined;
};

const MS_PER_DAY = 86_400_000;

function parseDate(iso: string) {
  return new Date(iso + 'T12:00:00');
}

function formatWeekLabel(dateIso: string) {
  const d = parseDate(dateIso);
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
}

/** Classifica provvisoria pre-gara (30 aprile). */
function buildProvisionalRow(
  memberIds: string[],
  provisionalRanks: Record<string, number>,
  memberCount: number,
): ChartRow {
  const row: ChartRow = {
    date: '2026-04-30',
    label: 'Partenza',
    isProvisional: true,
  };

  for (const id of memberIds) {
    row[id] = provisionalRanks[id] ?? memberCount;
  }

  return row;
}

/** Una snapshot a settimana (ultimo giorno di ogni settimana) + primo e ultimo giorno. */
function aggregateWeekly(
  rankTimeline: RankTimelinePoint[],
  memberIds: string[],
  provisionalRanks: Record<string, number>,
  memberCount: number,
): ChartRow[] {
  const byDate = new Map<string, Record<string, number>>();
  for (const point of rankTimeline) {
    if (!byDate.has(point.date)) byDate.set(point.date, {});
    byDate.get(point.date)![point.memberId] = point.rank;
  }

  const sortedDates = [...byDate.keys()].sort();
  if (sortedDates.length === 0) return [];

  const start = parseDate(sortedDates[0]);
  const dailyRows = sortedDates.map((date) => {
    const ranks = byDate.get(date)!;
    const row: Record<string, number | string> = { date, label: '' };
    for (const id of memberIds) {
      row[id] = ranks[id] ?? memberIds.length;
    }
    return row;
  });

  const picked = new Map<string, Record<string, number | string>>();

  for (const row of dailyRows) {
    const d = parseDate(String(row.date));
    const weekIndex = Math.floor((d.getTime() - start.getTime()) / (7 * MS_PER_DAY));
    picked.set(String(weekIndex), row);
  }

  picked.set('first', dailyRows[0]);
  picked.set('last', dailyRows[dailyRows.length - 1]);

  const uniqueRows = new Map<string, Record<string, number | string>>();
  for (const row of picked.values()) {
    uniqueRows.set(String(row.date), row);
  }

  const weekly = [...uniqueRows.values()]
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .map((row, index, arr) => ({
      ...row,
      label:
        index === arr.length - 1
          ? 'Arrivo'
          : formatWeekLabel(String(row.date)),
    })) as ChartRow[];

  return [buildProvisionalRow(memberIds, provisionalRanks, memberCount), ...weekly];
}

function AvatarNode({
  cx,
  cy,
  member,
}: {
  cx?: number;
  cy?: number;
  member: { color: string; initials: string; displayName: string };
}) {
  if (cx == null || cy == null) return null;
  return (
    <g aria-label={member.displayName}>
      <circle cx={cx} cy={cy} r={18} fill={member.color} stroke="#fff" strokeWidth={2.5} />
      <text
        x={cx}
        y={cy + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#fff"
        fontSize={10}
        fontWeight={700}
      >
        {member.initials}
      </text>
    </g>
  );
}

function ChartDot({
  cx,
  cy,
  value,
  index,
  lastIndex,
  color,
  member,
}: {
  cx?: number;
  cy?: number;
  value?: number;
  index?: number;
  lastIndex: number;
  color: string;
  member: { color: string; initials: string; displayName: string };
}) {
  if (index === 0 || index === lastIndex) {
    return <AvatarNode cx={cx} cy={cy} member={member} />;
  }
  return <RankNode cx={cx} cy={cy} value={value} color={color} />;
}

function RankNode({
  cx,
  cy,
  value,
  color,
}: {
  cx?: number;
  cy?: number;
  value?: number;
  color: string;
}) {
  if (cx == null || cy == null || value == null) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={16} fill={color} stroke="#fff" strokeWidth={2.5} />
      <text
        x={cx}
        y={cy + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#fff"
        fontSize={12}
        fontWeight={700}
      >
        {value}
      </text>
    </g>
  );
}

function RankTooltip({
  active,
  payload,
  label,
  members,
  provisional,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; color: string }>;
  label?: string;
  members: MemberMap;
  provisional?: boolean;
}) {
  if (!active || !payload?.length) return null;

  const sorted = [...payload].sort((a, b) => a.value - b.value);

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="mb-2 font-semibold text-slate-700">{label}</p>
      {provisional && (
        <p className="mb-2 text-slate-500">Classifica provvisoria di partenza</p>
      )}
      <ul className="space-y-1">
        {sorted.map((entry) => {
          const member = members[entry.dataKey];
          if (!member) return null;
          return (
            <li key={entry.dataKey} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-slate-600">{member.displayName.split(' ')[0]}</span>
              <span className="ml-auto font-bold text-slate-900">{entry.value}°</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function BumpChart({
  rankTimeline,
  members,
  memberCount,
  provisionalRanks,
}: BumpChartProps) {
  const memberIds = useMemo(
    () => [...new Set(rankTimeline.map((p) => p.memberId))],
    [rankTimeline],
  );

  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const chartData = useMemo(
    () => aggregateWeekly(rankTimeline, memberIds, provisionalRanks, memberCount),
    [rankTimeline, memberIds, provisionalRanks, memberCount],
  );

  const toggle = (id: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const rankTicks = useMemo(
    () => Array.from({ length: memberCount }, (_, i) => i + 1),
    [memberCount],
  );

  const lastIndex = chartData.length - 1;

  return (
    <section className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
      <h2 className="text-xl font-bold text-slate-900">Bump chart — classifica</h2>
      <p className="mt-1 text-sm text-slate-500">
        Tutti partono dalla classifica provvisoria · poi snapshot a fine settimana
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

      <div className="mt-6 h-[32rem] min-h-[32rem]">
        <ResponsiveContainer width="100%" height="100%" minHeight={512}>
          <LineChart
            data={chartData}
            margin={{ top: 24, right: 32, left: 8, bottom: 8 }}
          >
            <CartesianGrid stroke="#f1f5f9" horizontal vertical={false} />
            {rankTicks.map((rank) => (
              <ReferenceLine
                key={rank}
                y={rank}
                stroke={rank <= 3 ? '#fde68a' : '#e2e8f0'}
                strokeWidth={rank <= 3 ? 2 : 1}
              />
            ))}
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={false}
              dy={8}
            />
            <YAxis
              reversed
              domain={[memberCount, 1]}
              ticks={rankTicks}
              allowDecimals={false}
              tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }}
              tickFormatter={(v) => `${v}`}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                const row = payload?.[0]?.payload as ChartRow | undefined;
                return (
                  <RankTooltip
                    active={active}
                    payload={payload?.map((p) => ({
                      dataKey: String(p.dataKey ?? ''),
                      value: Number(p.value),
                      color: String(p.color ?? '#888'),
                    }))}
                    label={String(label ?? '')}
                    members={members}
                    provisional={row?.isProvisional === true}
                  />
                );
              }}
            />
            {memberIds.map((id) => {
              const member = members[id];
              if (!member || hidden.has(id)) return null;
              return (
                <Line
                  key={id}
                  type="linear"
                  dataKey={id}
                  name={member.displayName}
                  stroke={member.color}
                  strokeWidth={3}
                  dot={(props) => (
                    <ChartDot
                      cx={props.cx}
                      cy={props.cy}
                      value={props.value as number}
                      index={props.index}
                      lastIndex={lastIndex}
                      color={member.color}
                      member={member}
                    />
                  )}
                  activeDot={false}
                  isAnimationActive={false}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-3 text-center text-xs text-slate-400">
        Tutti partono dalla classifica provvisoria · Le icone segnano partenza e arrivo
      </p>
    </section>
  );
}

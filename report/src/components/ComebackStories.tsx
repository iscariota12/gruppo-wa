import { useMemo, type ReactNode } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type {
  ComebackHighlight,
  EarlyRecoveryHighlight,
  MemberMap,
  OvertakeStory,
} from '../types';
import { MemberAvatar } from './MemberAvatar';

interface ComebackStoriesProps {
  bestComeback: ComebackHighlight;
  earlyRecovery: EarlyRecoveryHighlight | null;
  members: MemberMap;
}

function formatShortDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
  });
}

function formatDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
  });
}

export function ComebackStories({
  bestComeback,
  earlyRecovery,
  members,
}: ComebackStoriesProps) {
  if (!bestComeback.overtakeStory && !earlyRecovery?.overtakeStory) return null;

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Storie di recupero</h2>
        <p className="mt-1 text-sm text-slate-500">
          I momenti chiave in cui la classifica ha cambiato volto
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {bestComeback.overtakeStory && (
          <RecoveryStoryCard
            icon="🚀"
            title="Miglior recupero"
            member={members[bestComeback.memberId]}
            summary={
              <>
                <span className="text-2xl font-bold">+{bestComeback.positionsGained}</span>
                <span className="text-slate-500"> posizioni</span>
                <p className="mt-1 text-sm text-slate-500">
                  {bestComeback.rankAtMidpoint}° a metà mese → {bestComeback.finalRank}° finale
                </p>
              </>
            }
            story={bestComeback.overtakeStory}
            members={members}
            heroId={bestComeback.memberId}
          />
        )}

        {earlyRecovery?.overtakeStory && (
          <RecoveryStoryCard
            icon="📈"
            title="Recupero dalla fase iniziale"
            member={members[earlyRecovery.memberId]}
            summary={
              <>
                <span className="text-2xl font-bold">
                  +{earlyRecovery.positionsGainedFromEarly}
                </span>
                <span className="text-slate-500"> posizioni</span>
                <p className="mt-1 text-sm text-slate-500">
                  {earlyRecovery.rankAtEarly}° nella 1ª settimana → {earlyRecovery.finalRank}°
                  finale
                </p>
                <p className="text-xs text-slate-400">
                  ({earlyRecovery.rankAtMidpoint}° a metà mese)
                </p>
              </>
            }
            story={earlyRecovery.overtakeStory}
            members={members}
            heroId={earlyRecovery.memberId}
          />
        )}
      </div>
    </section>
  );
}

function RecoveryStoryCard({
  icon,
  title,
  member,
  summary,
  story,
  members,
  heroId,
}: {
  icon: string;
  title: string;
  member?: MemberMap[string];
  summary: ReactNode;
  story: OvertakeStory;
  members: MemberMap;
  heroId: string;
}) {
  const chartData = useMemo(() => {
    const byDate = new Map<string, Record<string, number | string>>();
    for (const point of story.chart.points) {
      if (!byDate.has(point.date)) {
        byDate.set(point.date, { date: point.date });
      }
      byDate.get(point.date)![point.memberId] = point.cumulative;
    }
    return [...byDate.values()].sort((a, b) =>
      String(a.date).localeCompare(String(b.date)),
    );
  }, [story.chart.points]);

  const overtakeDates = story.keyOvertakes.map((o) => o.date);

  return (
    <article className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">{icon}</span>
            <h3 className="font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
          </div>
          {member && (
            <div className="mt-3 flex items-center gap-3">
              <MemberAvatar member={member} size="md" showRing />
              <div>
                <p className="font-bold text-slate-900">{member.displayName}</p>
                <div className="text-slate-800">{summary}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {story.keyOvertakes.map((o) => {
          const passed = members[o.passedId];
          return (
            <li
              key={`${o.date}-${o.passedId}`}
              className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm"
            >
              <span className="font-medium text-slate-600">{formatDate(o.date)}</span>
              <span className="text-slate-400">→</span>
              <span className="font-semibold text-slate-800">sorpasso a</span>
              {passed && <MemberAvatar member={passed} size="sm" />}
              <span className="font-medium">{passed?.displayName.split(' ')[0]}</span>
              <span className="ml-auto text-xs text-slate-400">
                {o.passerTotal}–{o.passedTotal}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-5 h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatShortDate}
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
            <Tooltip
              labelFormatter={(label) => formatShortDate(String(label))}
              contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
            />
            <Legend
              formatter={(value) => members[value]?.displayName.split(' ')[0] ?? value}
              wrapperStyle={{ fontSize: 11 }}
            />
            {overtakeDates.map((d) => (
              <ReferenceLine
                key={d}
                x={d}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                strokeWidth={1.5}
              />
            ))}
            {story.chart.memberIds.map((id) => {
              const m = members[id];
              if (!m) return null;
              return (
                <Line
                  key={id}
                  type="monotone"
                  dataKey={id}
                  name={id}
                  stroke={m.color}
                  strokeWidth={id === heroId ? 3 : 2}
                  strokeDasharray={id === heroId ? undefined : '6 3'}
                  dot={{ r: id === heroId ? 3 : 2 }}
                  activeDot={{ r: 5 }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-center text-xs text-slate-400">
        Linee tratteggiate = sorpassati · Linea continua = recupero · Barre = giorno del sorpasso
      </p>
    </article>
  );
}

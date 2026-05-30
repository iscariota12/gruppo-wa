import type { ReactNode } from 'react';
import type { MemberMap, ReportData } from '../types';
import { MemberAvatar } from './MemberAvatar';

interface ExtraStatsProps {
  extras: ReportData['extras'];
  members: MemberMap;
}

const SLOT_LABELS: Record<string, string> = {
  mattina: 'Mattina (6–12)',
  pomeriggio: 'Pomeriggio (12–18)',
  sera: 'Sera (18–24)',
  notte: 'Notte (0–6)',
};

function formatDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function ExtraStats({ extras, members }: ExtraStatsProps) {
  const ww = extras.weekendWarrior;
  const wwMember = members[ww.memberId];
  const firstMember = members[extras.firstOfDay.memberId];
  const nightMember = members[extras.nightOwl.memberId];

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900">Statistiche extra</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ExtraCard title="Giorno più intenso" icon="💥">
          <p className="text-2xl font-bold">{extras.busiestDay.count} 💩</p>
          <p className="mt-1 text-sm capitalize text-slate-500">
            {formatDate(extras.busiestDay.date)}
          </p>
        </ExtraCard>

        <ExtraCard title="Fascia oraria globale" icon="⏰">
          <p className="text-2xl font-bold capitalize">
            {SLOT_LABELS[extras.preferredTimeSlot.global] ?? extras.preferredTimeSlot.global}
          </p>
          <div className="mt-2 space-y-1 text-xs text-slate-500">
            {Object.entries(extras.preferredTimeSlot.globalCounts).map(([slot, count]) => (
              <div key={slot} className="flex justify-between">
                <span className="capitalize">{SLOT_LABELS[slot] ?? slot}</span>
                <span>{count}</span>
              </div>
            ))}
          </div>
        </ExtraCard>

        <ExtraCard title="Guerriero del weekend" icon="🏖️">
          {wwMember && (
            <div className="flex items-center gap-3">
              <MemberAvatar member={wwMember} size="md" />
              <div>
                <p className="font-semibold">{wwMember.displayName}</p>
                <p className="text-sm text-slate-500">
                  {ww.weekendPercentage}% nel weekend ({ww.weekendCount}/{ww.weekendCount + ww.weekdayCount})
                </p>
              </div>
            </div>
          )}
        </ExtraCard>

        <ExtraCard title="Primo del giorno" icon="🌅">
          {firstMember && (
            <div className="flex items-center gap-3">
              <MemberAvatar member={firstMember} size="md" />
              <div>
                <p className="font-semibold">{firstMember.displayName}</p>
                <p className="text-sm text-slate-500">
                  Primo 💩 del giorno {extras.firstOfDay.count} volte
                </p>
              </div>
            </div>
          )}
        </ExtraCard>

        <ExtraCard title="Notturno" icon="🦉">
          {nightMember && (
            <div className="flex items-center gap-3">
              <MemberAvatar member={nightMember} size="md" />
              <div>
                <p className="font-semibold">{nightMember.displayName}</p>
                <p className="text-sm text-slate-500">
                  {extras.nightOwl.count} 💩 tra le 22:00 e le 6:00
                </p>
              </div>
            </div>
          )}
        </ExtraCard>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
        <h3 className="font-bold text-slate-900">Leader a metà vs finale</h3>
        <p className="mt-1 text-sm text-slate-500">Confronto posizione al 15 maggio vs 30 maggio</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-2 pr-4 font-medium">Partecipante</th>
                <th className="pb-2 pr-4 font-medium text-center">15 mag</th>
                <th className="pb-2 pr-4 font-medium text-center">30 mag</th>
                <th className="pb-2 font-medium text-center">Variazione</th>
              </tr>
            </thead>
            <tbody>
              {extras.midpointVsFinal.map((row) => {
                const member = members[row.memberId];
                if (!member) return null;
                return (
                  <tr key={row.memberId} className="border-b border-slate-100">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <MemberAvatar member={member} size="sm" />
                        <span className="font-medium">{member.displayName}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-center">{row.rankAtMidpoint}°</td>
                    <td className="py-3 pr-4 text-center font-semibold">{row.finalRank}°</td>
                    <td className="py-3 text-center">
                      <ChangeBadge change={row.change} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function ExtraCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: ReactNode;
}) {
  return (
    <article className="rounded-2xl bg-white p-5 shadow-lg ring-1 ring-slate-200">
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <h3 className="font-semibold text-slate-800">{title}</h3>
      </div>
      <div className="mt-4 text-slate-900">{children}</div>
    </article>
  );
}

function ChangeBadge({ change }: { change: number }) {
  if (change > 0) {
    return (
      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
        ↑ {change}
      </span>
    );
  }
  if (change < 0) {
    return (
      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
        ↓ {Math.abs(change)}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
      =
    </span>
  );
}

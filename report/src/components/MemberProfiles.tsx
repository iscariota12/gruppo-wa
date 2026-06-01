import type { MemberMap, MemberProfile, StreakHighlight } from '../types';
import { MemberAvatar } from './MemberAvatar';

const SLOT_LABELS: Record<string, string> = {
  mattina: 'Mattina (6–12)',
  pomeriggio: 'Pomeriggio (12–18)',
  sera: 'Sera (18–24)',
  notte: 'Notte (0–6)',
};

function formatDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('it-IT', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  });
}

function formatStreak(streak: StreakHighlight) {
  if (!streak.from || !streak.to || streak.days === 0) return '—';
  const from = new Date(streak.from + 'T12:00:00').toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
  });
  const to = new Date(streak.to + 'T12:00:00').toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
  });
  return `${streak.days} gg (${from} → ${to})`;
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 py-2 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-semibold text-slate-800">{value}</span>
    </div>
  );
}

function MemberCard({
  profile,
  member,
  totalDays,
}: {
  profile: MemberProfile;
  member: MemberMap[string];
  totalDays: number;
}) {
  if (!member) return null;

  const intensest =
    profile.intensestDay.count > 0
      ? `${profile.intensestDay.count} 💩 · ${formatDate(profile.intensestDay.date)}`
      : '—';

  return (
    <article className="rounded-2xl bg-white p-5 shadow-lg ring-1 ring-slate-200">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <MemberAvatar member={member} size="md" showRing />
        <div>
          <h3 className="font-bold text-slate-900">{member.displayName}</h3>
          <p className="text-sm text-slate-500">
            {profile.finalRank}° posto · {profile.totalVisits} 💩 totali
          </p>
        </div>
      </div>

      <div className="mt-3">
        <StatRow
          label="Fascia oraria più attiva"
          value={SLOT_LABELS[profile.preferredTimeSlot] ?? profile.preferredTimeSlot}
        />
        <StatRow
          label="Media oraria prima 💩 del giorno"
          value={profile.avgFirstVisitTime ?? '—'}
        />
        <StatRow label="Giorno più intenso" value={intensest} />
        <StatRow
          label="Streak attiva più lunga"
          value={formatStreak(profile.longestVisitStreak)}
        />
        <StatRow
          label="Streak a secco più lunga"
          value={formatStreak(profile.longestDryStreak)}
        />
        <StatRow
          label="Media giornaliera (periodo)"
          value={`${profile.dailyAverage} 💩/giorno`}
        />
        <StatRow
          label="Media nei giorni attivi"
          value={`${profile.dailyAverageActiveDays} 💩/giorno`}
        />
        <StatRow
          label="Giorni attivi"
          value={`${profile.activeDays} su ${totalDays}`}
        />
        <StatRow
          label="Primo del giorno (gruppo)"
          value={`${profile.firstOfDayCount} volte`}
        />
        <StatRow
          label="Visite notturne (22–6)"
          value={`${profile.nightVisitCount}`}
        />
        <StatRow
          label="Quota weekend"
          value={`${profile.weekendPercentage}%`}
        />
        <StatRow
          label="Pausa max tra due 💩"
          value={profile.maxGapHours > 0 ? `${profile.maxGapHours} ore` : '—'}
        />
      </div>
    </article>
  );
}

interface MemberProfilesProps {
  profiles: MemberProfile[];
  members: MemberMap;
  totalDays: number;
}

export function MemberProfiles({ profiles, members, totalDays }: MemberProfilesProps) {
  return (
    <section>
      <h2 className="text-xl font-bold text-slate-900">Schede partecipanti</h2>
      <p className="mt-1 text-sm text-slate-500">
        Statistiche personali sul periodo di {totalDays} giorni
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {profiles.map((profile) => (
          <MemberCard
            key={profile.memberId}
            profile={profile}
            member={members[profile.memberId]}
            totalDays={totalDays}
          />
        ))}
      </div>
    </section>
  );
}

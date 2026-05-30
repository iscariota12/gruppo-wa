import { useEffect, useMemo, useState } from 'react';
import { ComebackStories } from './components/ComebackStories';
import { CumulativeTimeline } from './components/CumulativeTimeline';
import { DailyAverages } from './components/DailyAverages';
import { ExtraStats } from './components/ExtraStats';
import { Header } from './components/Header';
import { HighlightCards } from './components/HighlightCards';
import { Podium } from './components/Podium';
import { BumpChart } from './components/BumpChart';
import { RankingList } from './components/RankingList';
import { SharePieChart } from './components/SharePieChart';
import type { MemberMap, ReportData } from './types';

function App() {
  const [data, setData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/report.json`)
      .then((res) => {
        if (!res.ok) throw new Error('Impossibile caricare i dati del report.');
        return res.json();
      })
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  const members = useMemo<MemberMap>(() => {
    if (!data) return {};
    return Object.fromEntries(data.members.map((m) => [m.id, m]));
  }, [data]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-8">
        <p className="rounded-xl bg-red-50 px-6 py-4 text-red-700">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <p className="text-4xl animate-pulse">💩</p>
          <p className="mt-4 text-slate-600">Caricamento report...</p>
        </div>
      </div>
    );
  }

  const top3 = data.ranking.filter((r) => r.rank <= 3).slice(0, 3);
  const rest = data.ranking.filter((r) => r.rank > 3);
  const thirdPlaceTotal = top3.find((r) => r.rank === 3)?.total ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 print:bg-white">
      <div className="report-container mx-auto max-w-6xl space-y-8 px-4 py-10 md:px-8 print:space-y-6 print:py-4">
        <Header meta={data.meta} />

        <div className="print-stack grid gap-8 lg:grid-cols-2">
          <Podium top3={top3} members={members} />
          <SharePieChart ranking={data.ranking} members={members} />
        </div>

        <RankingList rest={rest} members={members} thirdPlaceTotal={thirdPlaceTotal} />

        <DailyAverages
          averages={data.dailyAverages}
          members={members}
          totalDays={data.meta.totalDays}
        />

        <div className="print-page-break space-y-8">
          <CumulativeTimeline timeline={data.timeline} members={members} />
          <BumpChart
            rankTimeline={data.rankTimeline}
            members={members}
            memberCount={data.members.length}
            provisionalRanks={data.provisionalRanks}
          />
        </div>

        <HighlightCards highlights={data.highlights} members={members} />

        <ComebackStories
          bestComeback={data.highlights.bestComeback}
          earlyRecovery={data.highlights.earlyRecovery}
          members={members}
        />

        <ExtraStats extras={data.extras} members={members} />

        <footer className="pb-8 text-center text-xs text-slate-400">
          Report generato il{' '}
          {new Date(data.meta.generatedAt).toLocaleString('it-IT')} · Dati da chat WhatsApp
        </footer>
      </div>
    </div>
  );
}

export default App;

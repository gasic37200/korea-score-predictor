type ScoreDistributionItem = {
  koreaScore: number;
  opponentScore: number;
  predictionCount: number;
  percentage: number;
};

export type MatchDistribution = {
  id: string;
  title: string;
  matchAtLabel: string;
  predictionClosesAtLabel: string;
  koreaTeamName: string;
  opponentTeamName: string;
  items: ScoreDistributionItem[];
};

export function ScoreDistributionCard({ match }: { match: MatchDistribution }) {
  const hasItems = match.items.length > 0;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div>
        <p className="text-xs font-semibold text-red-700">{match.koreaTeamName}</p>
        <h2 className="mt-1 text-lg font-bold leading-tight">{match.title}</h2>
        <div className="mt-3 grid gap-2 text-xs font-semibold">
          <p className="rounded-md bg-slate-50 px-3 py-2 text-slate-700">
            경기 시작: {match.matchAtLabel || "관리자 등록 전"}
          </p>
          <p className="rounded-md bg-red-50 px-3 py-2 text-red-800">
            예측 마감: {match.predictionClosesAtLabel || "경기 시작 전까지"}
          </p>
        </div>
        <p className="mt-3 text-xs text-slate-500">높은 예측 비율 순으로 표시됩니다.</p>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {hasItems ? (
          match.items.map((item) => (
            <DistributionBar
              key={`${item.koreaScore}-${item.opponentScore}`}
              item={item}
              opponentTeamName={match.opponentTeamName}
            />
          ))
        ) : (
          <p className="rounded-md bg-slate-50 px-3 py-4 text-sm leading-6 text-slate-500">
            아직 이 경기의 예측 데이터가 없습니다.
          </p>
        )}
      </div>
    </section>
  );
}

function DistributionBar({
  item,
  opponentTeamName,
}: {
  item: ScoreDistributionItem;
  opponentTeamName: string;
}) {
  const width = `${Math.min(Math.max(item.percentage, 0), 100)}%`;

  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-bold">
          대한민국 {item.koreaScore} : {item.opponentScore} {opponentTeamName}
        </p>
        <p className="shrink-0 text-sm font-bold text-red-700">
          {item.percentage.toFixed(1)}%
        </p>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-red-700" style={{ width }} />
      </div>
      <p className="text-xs text-slate-500">{item.predictionCount}명 예측</p>
    </div>
  );
}

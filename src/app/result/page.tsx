import { ResultSummary } from "@/components/result/ResultSummary";
import { ScoreDistributionCard } from "@/components/result/ScoreDistributionCard";
import { getResultData } from "@/lib/results";

export const dynamic = "force-dynamic";

export default function ResultPage() {
  return <ResultPageContent />;
}

async function ResultPageContent() {
  const result = await loadResultData();

  return (
    <main className="min-h-screen bg-[oklch(97.5%_0.018_78)] px-4 py-6 text-slate-950">
      <section className="mx-auto flex w-full max-w-md flex-col gap-5">
        {result.status === "ready" ? (
          <>
            <ResultSummary participantCount={result.data.participantCount} />

            <div className="flex flex-col gap-3">
              {result.data.matchDistributions.map((match) => (
                <ScoreDistributionCard key={match.id} match={match} />
              ))}
            </div>
          </>
        ) : (
          <ResultSetupNotice message={result.message} />
        )}
      </section>
    </main>
  );
}

async function loadResultData() {
  try {
    return { status: "ready" as const, data: await getResultData() };
  } catch (error) {
    if (error instanceof Error && error.message.includes("environment variables")) {
      return {
        status: "setup" as const,
        message: "Supabase 서버 환경 변수가 아직 설정되지 않았습니다.",
      };
    }

    return {
      status: "setup" as const,
      message: error instanceof Error ? error.message : "결과 데이터를 불러오지 못했습니다.",
    };
  }
}

function ResultSetupNotice({ message }: { message: string }) {
  return (
    <section className="rounded-lg border border-red-950/10 bg-[oklch(99%_0.01_85)] p-5 shadow-[0_18px_40px_rgba(30,41,59,0.08)]">
      <p className="text-sm font-semibold text-red-700">결과 준비 중</p>
      <h1 className="mt-2 text-2xl font-bold leading-tight">집계 연결이 필요합니다</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Supabase SQL과 서버 환경 변수를 설정하면 참여자 수와 스코어 예측 비율이
        표시됩니다.
      </p>
    </section>
  );
}

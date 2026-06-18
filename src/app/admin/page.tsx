import Link from "next/link";
import { logoutAdmin } from "@/app/admin/actions";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { ParticipantTable, PredictionTable, WinnerTable } from "@/components/admin/AdminTable";
import { isAdminAuthenticated, isAdminConfigured } from "@/lib/auth";
import { getAdminDashboardData } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ matchId?: string }>;
}) {
  const params = await searchParams;

  if (!isAdminConfigured()) {
    return <AdminShell title="관리자 설정 필요" description="ADMIN_PASSWORD_HASH가 필요합니다." />;
  }

  if (!(await isAdminAuthenticated())) {
    return (
      <AdminShell title="관리자 로그인" description="이벤트 운영 데이터는 보호되어 있습니다.">
        <AdminLoginForm />
      </AdminShell>
    );
  }

  const result = await loadDashboardData(params.matchId);

  return (
    <AdminShell
      title="관리자 대시보드"
      description="참여자 수, 예측 현황, 마스킹된 참여자 정보를 확인합니다."
      actions={<AdminActions />}
    >
      {result.status === "ready" ? (
        <div className="flex flex-col gap-4">
          <section className="grid grid-cols-2 gap-3">
            <Metric label="선택 경기 참여자" value={result.data.participantCount} />
            <Metric label="선택 경기 예측 수" value={result.data.predictionCount} />
          </section>
          <MatchParticipantFilter
            matches={result.data.matches}
            selectedMatchId={result.data.selectedMatchId}
          />
          <WinnerTable winners={result.data.winners} />
          <ParticipantTable
            participants={result.data.participants}
            title={
              result.data.matches.find((match) => match.id === result.data.selectedMatchId)?.title ??
              "선택된 경기"
            }
          />
          <PredictionTable predictions={result.data.predictions} />
        </div>
      ) : (
        <AdminNotice message={result.message} />
      )}
    </AdminShell>
  );
}

function MatchParticipantFilter({
  matches,
  selectedMatchId,
}: {
  matches: Array<{ id: string; title: string; is_open: boolean; predictionCount: number }>;
  selectedMatchId: string | null;
}) {
  if (matches.length === 0) {
    return null;
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold">경기별 참여자 보기</h2>
          <p className="mt-1 text-sm text-slate-600">
            경기를 선택하면 아래 참여자 목록이 해당 경기 기준으로 바뀝니다.
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {matches.map((match, index) => {
          const active = match.id === selectedMatchId;

          return (
            <Link
              className={
                active
                  ? "rounded-full bg-red-700 px-3 py-2 text-sm font-bold text-white"
                  : "rounded-full border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700"
              }
              href={`/admin?matchId=${match.id}`}
              key={match.id}
            >
              {index + 1}번 경기 · {match.title}
              {match.is_open ? " · 표시 중" : ""}
              <span className="ml-2 text-xs opacity-80">{match.predictionCount}명</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function AdminShell({
  actions,
  children,
  description,
  title,
}: {
  actions?: React.ReactNode;
  children?: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <main className="min-h-screen bg-[oklch(97.5%_0.018_78)] px-4 py-6 text-slate-950">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <header className="flex flex-col gap-4 rounded-lg border border-red-950/10 bg-[oklch(99%_0.01_85)] p-5 shadow-[0_18px_40px_rgba(30,41,59,0.08)] sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-red-700">Korea Score Predictor</p>
            <h1 className="mt-2 text-2xl font-bold leading-tight">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </div>
          {actions}
        </header>
        {children}
      </section>
    </main>
  );
}

function AdminActions() {
  return (
    <div className="flex flex-wrap gap-2">
      <Link className="rounded-md bg-slate-950 px-3 py-2 text-sm font-bold text-white" href="/admin/matches">
        경기 관리
      </Link>
      <Link className="rounded-md bg-red-700 px-3 py-2 text-sm font-bold text-white" href="/admin/export">
        CSV export
      </Link>
      <Link className="rounded-md border border-slate-300 px-3 py-2 text-sm font-bold" href="/result">
        결과 화면
      </Link>
      <form action={logoutAdmin}>
        <button className="rounded-md border border-slate-300 px-3 py-2 text-sm font-bold" type="submit">
          로그아웃
        </button>
      </form>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </article>
  );
}

function AdminNotice({ message }: { message: string }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-sm leading-6 text-slate-600">{message}</p>
    </section>
  );
}

async function loadDashboardData(matchId?: string) {
  try {
    return { status: "ready" as const, data: await getAdminDashboardData(matchId) };
  } catch (error) {
    return {
      status: "setup" as const,
      message: error instanceof Error ? error.message : "관리자 데이터를 불러오지 못했습니다.",
    };
  }
}

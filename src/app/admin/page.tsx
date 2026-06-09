import Link from "next/link";
import { logoutAdmin } from "@/app/admin/actions";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { ParticipantTable, PredictionTable, WinnerTable } from "@/components/admin/AdminTable";
import { isAdminAuthenticated, isAdminConfigured } from "@/lib/auth";
import { getAdminDashboardData } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
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

  const result = await loadDashboardData();

  return (
    <AdminShell
      title="관리자 대시보드"
      description="참여자 수, 예측 현황, 마스킹된 참여자 정보를 확인합니다."
      actions={<AdminActions />}
    >
      {result.status === "ready" ? (
        <div className="flex flex-col gap-4">
          <section className="grid grid-cols-2 gap-3">
            <Metric label="참여자" value={result.data.participantCount} />
            <Metric label="예측 수" value={result.data.predictionCount} />
          </section>
          <WinnerTable winners={result.data.winners} />
          <ParticipantTable participants={result.data.participants} />
          <PredictionTable predictions={result.data.predictions} />
        </div>
      ) : (
        <AdminNotice message={result.message} />
      )}
    </AdminShell>
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

async function loadDashboardData() {
  try {
    return { status: "ready" as const, data: await getAdminDashboardData() };
  } catch (error) {
    return {
      status: "setup" as const,
      message: error instanceof Error ? error.message : "관리자 데이터를 불러오지 못했습니다.",
    };
  }
}

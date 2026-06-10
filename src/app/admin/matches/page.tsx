import Link from "next/link";
import type { ReactNode } from "react";
import { MatchEditor } from "@/components/admin/MatchEditor";
import { getAdminMatches } from "@/lib/admin";
import { isAdminAuthenticated, isAdminConfigured } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminMatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string; tab?: string }>;
}) {
  const params = await searchParams;

  if (!isAdminConfigured() || !(await isAdminAuthenticated())) {
    return (
      <AdminMatchesShell>
        <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">
          관리자 로그인이 필요합니다. 먼저 관리자 대시보드에 로그인해 주세요.
        </p>
      </AdminMatchesShell>
    );
  }

  const result = await loadMatches();

  return (
    <AdminMatchesShell feedback={params}>
      {result.status === "ready" ? (
        <MatchEditor initialTab={params.tab === "manage" ? "manage" : "create"} matches={result.data} />
      ) : (
        <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">
          {result.message}
        </p>
      )}
    </AdminMatchesShell>
  );
}

function AdminMatchesShell({
  children,
  feedback,
}: {
  children: ReactNode;
  feedback?: { error?: string; notice?: string };
}) {
  return (
    <main className="min-h-screen bg-[oklch(97.5%_0.018_78)] px-4 py-6 text-slate-950">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        <header className="rounded-lg border border-red-950/10 bg-[oklch(99%_0.01_85)] p-5 shadow-[0_18px_40px_rgba(30,41,59,0.08)]">
          <div className="flex flex-wrap gap-2">
            <Link className="rounded-md bg-slate-950 px-3 py-2 text-sm font-bold text-white" href="/admin">
              관리자 홈
            </Link>
            <Link className="rounded-md border border-slate-300 px-3 py-2 text-sm font-bold" href="/event">
              이벤트 화면
            </Link>
            <Link className="rounded-md border border-slate-300 px-3 py-2 text-sm font-bold" href="/result">
              결과 화면
            </Link>
          </div>
          <h1 className="mt-2 text-2xl font-bold">경기 관리</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            제목과 상대팀을 입력하면 이벤트 페이지에 경기 카드가 만들어집니다.
          </p>
        </header>
        {feedback?.notice ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
            {feedback.notice}
          </p>
        ) : null}
        {feedback?.error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
            {feedback.error}
          </p>
        ) : null}
        {children}
      </section>
    </main>
  );
}

async function loadMatches() {
  try {
    return { status: "ready" as const, data: await getAdminMatches() };
  } catch (error) {
    return {
      status: "setup" as const,
      message: error instanceof Error ? error.message : "경기 목록을 불러오지 못했습니다.",
    };
  }
}

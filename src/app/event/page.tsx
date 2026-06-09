import { EventForm } from "@/components/event/EventForm";
import { getOpenEventMatches } from "@/lib/event";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EventPage() {
  const matches = await loadEventMatches();

  return (
    <main className="min-h-screen bg-[oklch(97.5%_0.018_78)] px-4 py-6 text-slate-950">
      <section className="mx-auto flex w-full max-w-md flex-col gap-5">
        <header className="relative overflow-hidden rounded-lg border border-red-950/10 bg-[oklch(99%_0.01_85)] p-5 shadow-[0_18px_40px_rgba(30,41,59,0.08)]">
          <div className="relative flex flex-col gap-4">
            <p className="text-sm font-semibold text-red-700">QR 스코어 예측 이벤트</p>
            <h1 className="mt-2 text-2xl font-bold leading-tight">
              대한민국 경기 스코어를 예측해 주세요
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              닉네임과 휴대폰 번호를 입력한 뒤 경기별 예상 점수를 남기면 참여가
              완료됩니다. 예측 비율은 제출 후 결과 화면에서만 공개됩니다.
            </p>
          </div>
        </header>

        {matches.message ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            {matches.message}
          </p>
        ) : null}

        {matches.data.length > 0 ? (
          <EventForm matches={matches.data} />
        ) : (
          <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
            현재 예측 가능한 경기가 없습니다. 관리자에서 경기를 표시 상태로 변경해 주세요.
          </p>
        )}

        <Link
          className="block rounded-lg border border-slate-300 bg-white px-4 py-3 text-center text-sm font-bold text-slate-800 shadow-sm"
          href="/result"
        >
          결과 화면 보기
        </Link>
      </section>
    </main>
  );
}

async function loadEventMatches() {
  try {
    const data = await getOpenEventMatches();

    if (data.length === 0) {
      return {
        data: [],
        message: "현재 열린 경기가 없습니다. 관리자에서 경기를 열어 주세요.",
      };
    }

    return { data, message: "" };
  } catch (error) {
    return {
      data: [],
      message:
        error instanceof Error
          ? `${error.message} 관리자 설정과 Supabase 권한을 확인해 주세요.`
          : "경기 정보를 불러오지 못했습니다.",
    };
  }
}

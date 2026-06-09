export function ResultSummary({ participantCount }: { participantCount: number }) {
  return (
    <section className="rounded-lg border border-red-950/10 bg-[oklch(99%_0.01_85)] p-5 shadow-[0_18px_40px_rgba(30,41,59,0.08)]">
      <p className="text-sm font-semibold text-red-700">제출 완료</p>
      <h1 className="mt-2 text-2xl font-bold leading-tight">예측이 접수되었습니다</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        참여해 주셔서 감사합니다. 아래에서 현재까지의 스코어 예측 흐름을 확인할 수
        있습니다.
      </p>

      <div className="mt-5 border-t border-slate-200 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          전체 참여자
        </p>
        <p className="mt-1 text-4xl font-black text-slate-950">{participantCount}</p>
      </div>
    </section>
  );
}

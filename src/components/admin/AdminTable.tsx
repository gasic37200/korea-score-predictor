import type { AdminParticipant, AdminPredictionRow, AdminWinnerRow } from "@/lib/admin";

export function ParticipantTable({ participants }: { participants: AdminParticipant[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-lg font-bold">최근 참여자</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs text-slate-500">
            <tr>
              <th className="py-2 pr-3 font-semibold">닉네임</th>
              <th className="py-2 pr-3 font-semibold">휴대폰</th>
              <th className="py-2 pr-3 font-semibold">제출 시간</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((participant) => (
              <tr key={participant.id} className="border-b border-slate-100 last:border-0">
                <td className="py-3 pr-3 font-medium">{participant.nickname}</td>
                <td className="py-3 pr-3 text-slate-600">{participant.maskedPhone}</td>
                <td className="py-3 pr-3 text-slate-600">
                  {formatDateTime(participant.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function PredictionTable({ predictions }: { predictions: AdminPredictionRow[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-lg font-bold">최근 예측</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs text-slate-500">
            <tr>
              <th className="py-2 pr-3 font-semibold">닉네임</th>
              <th className="py-2 pr-3 font-semibold">휴대폰</th>
              <th className="py-2 pr-3 font-semibold">경기</th>
              <th className="py-2 pr-3 font-semibold">예측</th>
              <th className="py-2 pr-3 font-semibold">제출 시간</th>
            </tr>
          </thead>
          <tbody>
            {predictions.map((prediction) => (
              <tr key={prediction.id} className="border-b border-slate-100 last:border-0">
                <td className="py-3 pr-3 font-medium">{prediction.nickname}</td>
                <td className="py-3 pr-3 text-slate-600">{prediction.maskedPhone}</td>
                <td className="py-3 pr-3 text-slate-600">{prediction.matchTitle}</td>
                <td className="py-3 pr-3 font-bold text-red-700">{prediction.predictedScore}</td>
                <td className="py-3 pr-3 text-slate-600">
                  {formatDateTime(prediction.submittedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function WinnerTable({ winners }: { winners: AdminWinnerRow[] }) {
  return (
    <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
      <h2 className="text-lg font-bold">당첨 후보</h2>
      <p className="mt-1 text-sm leading-6 text-emerald-900">
        관리자가 실제 경기 결과를 입력한 경기만 표시됩니다. 휴대폰 번호는 마스킹된
        값만 보여줍니다.
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-emerald-200 text-xs text-emerald-900">
            <tr>
              <th className="py-2 pr-3 font-semibold">닉네임</th>
              <th className="py-2 pr-3 font-semibold">휴대폰</th>
              <th className="py-2 pr-3 font-semibold">경기</th>
              <th className="py-2 pr-3 font-semibold">예측</th>
              <th className="py-2 pr-3 font-semibold">제출 시간</th>
            </tr>
          </thead>
          <tbody>
            {winners.length > 0 ? (
              winners.map((winner) => (
                <tr key={winner.id} className="border-b border-emerald-100 last:border-0">
                  <td className="py-3 pr-3 font-medium">{winner.nickname}</td>
                  <td className="py-3 pr-3 text-emerald-950">{winner.maskedPhone}</td>
                  <td className="py-3 pr-3 text-emerald-950">{winner.matchTitle}</td>
                  <td className="py-3 pr-3 font-bold text-red-700">{winner.predictedScore}</td>
                  <td className="py-3 pr-3 text-emerald-950">
                    {formatDateTime(winner.submittedAt)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="py-4 text-sm text-emerald-900" colSpan={5}>
                  아직 실제 결과와 정확히 일치한 예측이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

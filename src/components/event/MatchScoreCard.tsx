"use client";

import { useEffect, useMemo, useState } from "react";

export type EventMatch = {
  id: string;
  title: string;
  matchAtLabel: string;
  predictionClosesAtLabel: string;
  predictionClosesAt: string | null;
  koreaTeamName: string;
  opponentTeamName: string;
  defaultKoreaScore: number;
  defaultOpponentScore: number;
};

export function MatchScoreCard({
  defaultKoreaScore,
  defaultOpponentScore,
  fieldIndex,
  match,
}: {
  defaultKoreaScore?: number;
  defaultOpponentScore?: number;
  fieldIndex: number;
  match: EventMatch;
}) {
  return (
    <fieldset className="rounded-lg border border-slate-200 bg-white p-4">
      <legend className="px-1 text-base font-bold">{match.title}</legend>

      <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2">
          <span className="text-xs font-bold text-slate-500">경기 시작</span>
          <span className="text-sm font-bold text-slate-950">{match.matchAtLabel}</span>
        </div>
        <PredictionDeadline
          closesAt={match.predictionClosesAt}
          label={match.predictionClosesAtLabel}
        />
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-end gap-3">
        <ScoreInput
          label={match.koreaTeamName}
          defaultValue={defaultKoreaScore ?? match.defaultKoreaScore}
          name={`predictions.${fieldIndex}.koreaScore`}
        />
        <span className="pb-3 text-sm font-bold text-slate-400">:</span>
        <ScoreInput
          label={match.opponentTeamName}
          defaultValue={defaultOpponentScore ?? match.defaultOpponentScore}
          name={`predictions.${fieldIndex}.opponentScore`}
        />
      </div>
    </fieldset>
  );
}

function PredictionDeadline({ closesAt, label }: { closesAt: string | null; label: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const status = useMemo(() => {
    if (!closesAt) {
      return { expired: false, text: "마감 시간 미정" };
    }

    const remainingMs = new Date(closesAt).getTime() - now;

    if (remainingMs <= 0) {
      return { expired: true, text: "예측 가능 시간이 지났습니다" };
    }

    return {
      expired: false,
      text: formatRemainingTime(remainingMs),
    };
  }, [closesAt, now]);

  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      <span className="text-xs font-bold text-slate-500">예측 마감</span>
      <div className="text-right">
        <p className="text-sm font-bold text-slate-950">{label}</p>
        <p
          className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-black tabular-nums ${
            status.expired ? "bg-red-100 text-red-800" : "bg-emerald-50 text-emerald-800"
          }`}
        >
          {status.text}
        </p>
      </div>
    </div>
  );
}

function formatRemainingTime(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const time = [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");

  if (days > 0) {
    return `D-${days} ${time}`;
  }

  return time;
}

function ScoreInput({
  label,
  defaultValue,
  name,
}: {
  label: string;
  defaultValue: number;
  name: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <input
        className="h-11 rounded-md border border-slate-300 px-3 text-center text-lg font-bold outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
        defaultValue={defaultValue}
        inputMode="numeric"
        max={20}
        min={0}
        name={name}
        type="number"
      />
    </label>
  );
}

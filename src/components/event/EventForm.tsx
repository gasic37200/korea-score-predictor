"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { submitPredictions, type EventSubmitState } from "@/app/event/actions";
import { MatchScoreCard, type EventMatch } from "@/components/event/MatchScoreCard";
import { PrivacyNotice } from "@/components/event/PrivacyNotice";
import { formatKoreanMobilePhone } from "@/lib/validation";

const initialState: EventSubmitState = {
  status: "idle",
  message: "",
};

export function EventForm({ matches }: { matches: EventMatch[] }) {
  const [formState, formAction, isPending] = useActionState(submitPredictions, initialState);
  const [phone, setPhone] = useState(formState.values?.phone ?? "");
  const [now, setNow] = useState(() => Date.now());
  const hasExpiredMatch = matches.some(
    (match) => match.predictionClosesAt && new Date(match.predictionClosesAt).getTime() <= now,
  );

  const submitLabel = useMemo(() => {
    if (isPending) {
      return "제출 중";
    }

    if (hasExpiredMatch) {
      return "예측 가능 시간이 지났습니다";
    }

    return "예측 제출하기";
  }, [hasExpiredMatch, isPending]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-5 rounded-lg border border-red-950/10 bg-[oklch(99%_0.01_85)] p-5 shadow-[0_18px_40px_rgba(30,41,59,0.08)]"
    >
      <input name="eventSlug" type="hidden" value="world-cup-2026" />
      <input name="matchCount" type="hidden" value={matches.length} />

      <div className="grid gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold">닉네임</span>
          <input
            autoComplete="nickname"
            className="h-12 rounded-md border border-slate-300 bg-white px-3 text-base outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100"
            defaultValue={formState.values?.nickname}
            maxLength={30}
            name="nickname"
            placeholder="예: 축구팬"
            type="text"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold">휴대폰 번호</span>
          <input
            autoComplete="tel"
            className="h-12 rounded-md border border-slate-300 bg-white px-3 text-base outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100"
            inputMode="tel"
            name="phone"
            onChange={(event) => setPhone(formatKoreanMobilePhone(event.target.value))}
            placeholder="010-1234-5678"
            type="tel"
            value={phone}
          />
          <span className="text-xs leading-5 text-slate-500">
            중복 참여 확인을 위해 서버에서 해시 처리합니다.
          </span>
        </label>
      </div>

      <div className="flex flex-col gap-3">
        {matches.map((match, index) => (
          <MatchScoreCard
            defaultKoreaScore={numberOrUndefined(formState.values?.predictions[index]?.koreaScore)}
            defaultOpponentScore={numberOrUndefined(
              formState.values?.predictions[index]?.opponentScore,
            )}
            fieldIndex={index}
            key={match.id}
            match={match}
          />
        ))}
      </div>

      <PrivacyNotice defaultChecked={formState.values?.privacyAgreed} />

      {hasExpiredMatch ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-bold leading-6 text-red-700">
          예측 가능 시간이 지난 경기가 있어 제출할 수 없습니다. 관리자에게 문의해 주세요.
        </p>
      ) : null}

      {formState.message ? (
        <p
          className={`rounded-md px-3 py-2 text-sm leading-6 ${
            formState.status === "ready"
              ? "bg-emerald-50 text-emerald-800"
              : "bg-red-50 text-red-700"
          }`}
          role="status"
        >
          {formState.message}
        </p>
      ) : null}

      <button
        className="h-12 rounded-md bg-red-700 px-4 text-base font-bold text-white transition hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-wait disabled:bg-red-300"
        disabled={isPending || hasExpiredMatch}
        type="submit"
      >
        {submitLabel}
      </button>
    </form>
  );
}

function numberOrUndefined(value: string | undefined) {
  if (value === undefined || value === "") {
    return undefined;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

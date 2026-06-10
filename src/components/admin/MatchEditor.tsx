"use client";

import { useState, type ReactNode } from "react";
import { createMatchAction, toggleMatchOpen, updateMatchAction } from "@/app/admin/actions";
import type { AdminMatch } from "@/lib/admin";

type MatchEditorTab = "create" | "manage";

export function MatchEditor({
  initialTab,
  matches,
}: {
  initialTab?: MatchEditorTab;
  matches: AdminMatch[];
}) {
  const [activeTab, setActiveTab] = useState<MatchEditorTab>(initialTab ?? "create");
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 rounded-lg border border-slate-200 bg-white p-1">
        <TabButton active={activeTab === "create"} onClick={() => setActiveTab("create")}>
          새 경기
        </TabButton>
        <TabButton active={activeTab === "manage"} onClick={() => setActiveTab("manage")}>
          기존 경기 {matches.length}
        </TabButton>
      </div>

      {activeTab === "create" ? <CreateMatchPanel /> : null}

      {activeTab === "manage" ? (
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-bold">기존 경기</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            아래 화살표를 누르면 자세히 수정할 수 있고, 위 화살표를 누르면 다시
            간략히 볼 수 있습니다. 새로 만든 경기가 위에 표시됩니다.
          </p>

          <div className="mt-4 flex flex-col gap-3">
            {matches.map((match) => (
              <MatchAccordion
                expanded={expandedMatchId === match.id}
                key={match.id}
                match={match}
                onToggle={() =>
                  setExpandedMatchId((currentId) => (currentId === match.id ? null : match.id))
                }
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function CreateMatchPanel() {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-lg font-bold">새 경기 추가</h2>
      <p className="mt-1 text-sm leading-6 text-slate-500">
        예: 제목은 `대한민국 조별리그 2차전`, 상대팀은 당일 확정된 나라를 입력하면
        이벤트 페이지에 새 예측 카드가 표시됩니다.
      </p>
      <form action={createMatchAction} className="mt-4 grid gap-3">
        <TextField label="경기 제목" name="title" placeholder="예: 대한민국 조별리그 2차전" />
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField defaultValue="대한민국" label="대한민국 팀명" name="koreaTeamName" />
          <TextField label="상대팀" name="opponentTeamName" placeholder="예: 독일" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="경기 시간" name="matchAt" type="datetime-local" />
          <TextField label="예측 마감 시간" name="predictionClosesAt" type="datetime-local" />
        </div>
        <button
          className="h-11 rounded-md bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800"
          type="submit"
        >
          경기 추가
        </button>
      </form>
    </section>
  );
}

function MatchAccordion({
  expanded,
  match,
  onToggle,
}: {
  expanded: boolean;
  match: AdminMatch;
  onToggle: () => void;
}) {
  const hasActualScore = match.actual_korea_score !== null && match.actual_opponent_score !== null;

  return (
    <article className="rounded-md border border-slate-200 bg-white">
      <div className="flex items-start justify-between gap-3 p-3">
        <div className="min-w-0">
          <h3 className="font-bold leading-tight">{match.title}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {match.korea_team_name} vs {match.opponent_team_name}
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
              예측 {match.predictionCount}명
            </span>
            {hasActualScore ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800">
                결과 {match.actual_korea_score}:{match.actual_opponent_score} · 당첨 후보{" "}
                {match.winnerCount}명
              </span>
            ) : (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-800">
                실제 결과 미입력
              </span>
            )}
            <span
              className={`rounded-full px-3 py-1 ${
                match.is_open ? "bg-blue-50 text-blue-800" : "bg-slate-100 text-slate-500"
              }`}
            >
              {match.is_open ? "표시 중" : "숨김"}
            </span>
          </div>
        </div>

        <button
          aria-expanded={expanded}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-300 text-slate-950"
          onClick={onToggle}
          type="button"
        >
          {expanded ? <ChevronUp /> : <ChevronDown />}
        </button>
      </div>

      {expanded ? (
        <div className="border-t border-slate-200 p-3">
          <form action={updateMatchAction} className="grid gap-3">
            <input name="matchId" type="hidden" value={match.id} />
            <TextField defaultValue={match.title} label="경기 제목" name="title" />
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField
                defaultValue={match.korea_team_name}
                label="대한민국 팀명"
                name="koreaTeamName"
              />
              <TextField
                defaultValue={match.opponent_team_name}
                label="상대팀"
                name="opponentTeamName"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField
                defaultValue={toDateTimeLocal(match.match_at)}
                label="경기 시간"
                name="matchAt"
                type="datetime-local"
              />
              <TextField
                defaultValue={toDateTimeLocal(match.prediction_closes_at)}
                label="예측 마감"
                name="predictionClosesAt"
                type="datetime-local"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField
                defaultValue={numberToString(match.actual_korea_score)}
                label="실제 대한민국 점수"
                name="actualKoreaScore"
                placeholder="경기 후 입력"
                type="number"
              />
              <TextField
                defaultValue={numberToString(match.actual_opponent_score)}
                label="실제 상대팀 점수"
                name="actualOpponentScore"
                placeholder="경기 후 입력"
                type="number"
              />
            </div>
            <button
              className="h-10 rounded-md bg-slate-950 px-3 text-sm font-bold text-white transition hover:bg-slate-800"
              type="submit"
            >
              수정 저장
            </button>
          </form>

          <form action={toggleMatchOpen} className="mt-2">
            <input name="matchId" type="hidden" value={match.id} />
            <input name="isOpen" type="hidden" value={String(!match.is_open)} />
            <button
              className={`h-10 rounded-md px-3 text-sm font-bold transition ${
                match.is_open
                  ? "bg-red-50 text-red-700 hover:bg-red-100"
                  : "bg-emerald-700 text-white hover:bg-emerald-800"
              }`}
              type="submit"
            >
              {match.is_open ? "이벤트 페이지에서 숨기기" : "이벤트 페이지에 표시"}
            </button>
          </form>
        </div>
      ) : null}
    </article>
  );
}

function ChevronDown() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
    </svg>
  );
}

function ChevronUp() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path
        d="m6 15 6-6 6 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
    </svg>
  );
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={`h-10 rounded-md text-sm font-bold transition ${
        active ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function numberToString(value: number | null) {
  return value === null ? "" : String(value);
}

function TextField({
  defaultValue,
  label,
  name,
  placeholder,
  type = "text",
}: {
  defaultValue?: string;
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        className="h-11 rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-red-700 focus:ring-2 focus:ring-red-100"
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
        type={type}
      />
    </label>
  );
}

function toDateTimeLocal(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 16);
}

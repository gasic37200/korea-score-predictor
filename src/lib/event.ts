import "server-only";

import type { EventMatch } from "@/components/event/MatchScoreCard";
import type { MatchRow } from "@/types/database";

const EVENT_SLUG = "world-cup-2026";

export async function getOpenEventMatches(): Promise<EventMatch[]> {
  const eventParams = new URLSearchParams({
    slug: `eq.${EVENT_SLUG}`,
    is_open: "eq.true",
    select: "id",
  });
  const event = await fetchSupabaseRows<{ id: string }>(`/events?${eventParams.toString()}`);
  const eventId = event[0]?.id;

  if (!eventId) {
    return [];
  }

  const matchParams = new URLSearchParams({
    event_id: `eq.${eventId}`,
    is_open: "eq.true",
    select: "*",
    order: "display_order.asc",
  });
  const data = await fetchSupabaseRows<MatchRow>(`/matches?${matchParams.toString()}`);

  return data.map((match) => ({
    id: match.id,
    title: match.title,
    matchAtLabel: formatDateLabel(match.match_at) || "관리자 등록 전",
    predictionClosesAtLabel: formatDateLabel(match.prediction_closes_at) || "경기 시작 전까지",
    predictionClosesAt: match.prediction_closes_at,
    koreaTeamName: match.korea_team_name,
    opponentTeamName: match.opponent_team_name,
    defaultKoreaScore: 0,
    defaultOpponentScore: 0,
  }));
}

async function fetchSupabaseRows<T>(path: string): Promise<T[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("서버 환경 변수가 아직 설정되지 않았습니다.");
  }

  const response = await fetch(`${supabaseUrl}/rest/v1${path}`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`${path} -> ${await response.text()}`);
  }

  return (await response.json()) as T[];
}

function formatDateLabel(value: string | null) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
  }).format(new Date(value));
}

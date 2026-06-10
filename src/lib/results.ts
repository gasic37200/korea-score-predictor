import "server-only";

import { createServiceSupabaseClient } from "@/lib/supabase/server";
import type { MatchDistribution } from "@/components/result/ScoreDistributionCard";
import type { MatchRow, ScoreDistributionRow } from "@/types/database";

const EVENT_SLUG = "world-cup-2026";

type ResultData = {
  participantCount: number;
  matchDistributions: MatchDistribution[];
};

export async function getResultData(): Promise<ResultData> {
  const supabase = createServiceSupabaseClient();
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id")
    .eq("slug", EVENT_SLUG)
    .maybeSingle();

  if (eventError) {
    throw new Error("이벤트 정보를 불러오지 못했습니다.");
  }

  if (!event) {
    return { participantCount: 0, matchDistributions: [] };
  }

  const [{ data: matches, error: matchesError }, distribution] = await Promise.all([
    supabase
      .from("matches")
      .select("*")
      .eq("event_id", event.id)
      .eq("is_open", true)
      .order("display_order", { ascending: true })
      .returns<MatchRow[]>(),
    supabase
      .from("score_distribution")
      .select("*")
      .eq("event_id", event.id)
      .order("percentage", { ascending: false })
      .returns<ScoreDistributionRow[]>(),
  ]);

  if (matchesError) {
    throw new Error("경기 정보를 불러오지 못했습니다.");
  }

  if (distribution.error) {
    throw new Error("예측 비율을 불러오지 못했습니다.");
  }

  const matchIds = (matches ?? []).map((match) => match.id);
  const { count: participantCount, error: participantsError } =
    matchIds.length > 0
      ? await supabase
          .from("participants")
          .select("id", { count: "exact", head: true })
          .in("match_id", matchIds)
      : { count: 0, error: null };

  if (participantsError) {
    throw new Error("참여자 수를 불러오지 못했습니다.");
  }

  return {
    participantCount: participantCount ?? 0,
    matchDistributions: buildMatchDistributions(matches ?? [], distribution.data ?? []),
  };
}

function buildMatchDistributions(
  matches: MatchRow[],
  distributionRows: ScoreDistributionRow[],
): MatchDistribution[] {
  return matches.map((match) => {
    const items = distributionRows
      .filter((row) => row.match_id === match.id)
      .sort((a, b) => b.percentage - a.percentage || b.prediction_count - a.prediction_count)
      .map((row) => ({
        koreaScore: row.korea_score,
        opponentScore: row.opponent_score,
        predictionCount: row.prediction_count,
        percentage: Number(row.percentage),
      }));

    return {
      id: match.id,
      title: match.title,
      matchAtLabel: formatDateLabel(match.match_at),
      predictionClosesAtLabel: formatDateLabel(match.prediction_closes_at),
      koreaTeamName: match.korea_team_name,
      opponentTeamName: match.opponent_team_name,
      items,
    };
  });
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

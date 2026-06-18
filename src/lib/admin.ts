import "server-only";

import { decryptPhoneNumber } from "@/lib/crypto";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import type { MatchRow, ParticipantRow, PredictionRow } from "@/types/database";

const EVENT_SLUG = "world-cup-2026";

export type AdminParticipant = {
  id: string;
  matchId: string;
  nickname: string;
  maskedPhone: string;
  createdAt: string;
};

export type AdminPredictionRow = {
  id: string;
  nickname: string;
  maskedPhone: string;
  exportPhone?: string;
  submittedAt: string;
  matchTitle: string;
  predictedScore: string;
};

export type AdminWinnerRow = {
  id: string;
  nickname: string;
  maskedPhone: string;
  submittedAt: string;
  matchTitle: string;
  predictedScore: string;
};

export type AdminMatch = MatchRow & {
  predictionCount: number;
  winnerCount: number;
};

export type AdminDashboardData = {
  selectedMatchId: string | null;
  participantCount: number;
  predictionCount: number;
  matches: AdminMatch[];
  participants: AdminParticipant[];
  predictions: AdminPredictionRow[];
  winners: AdminWinnerRow[];
};

type PredictionParticipant = Pick<
  ParticipantRow,
  "nickname" | "phone_last4" | "encrypted_phone" | "created_at"
>;

type PredictionWithRelations = PredictionRow & {
  participants: PredictionParticipant | null;
  matches:
    | Pick<
        MatchRow,
        "title" | "actual_korea_score" | "actual_opponent_score"
      >
    | null;
};

export async function getAdminDashboardData(selectedMatchId?: string): Promise<AdminDashboardData> {
  const supabase = createServiceSupabaseClient();
  const eventId = await getEventId(supabase);

  if (!eventId) {
    return {
      selectedMatchId: null,
      participantCount: 0,
      predictionCount: 0,
      matches: [],
      participants: [],
      predictions: [],
      winners: [],
    };
  }

  const [matchesResult, predictionsResult] =
    await Promise.all([
      supabase
        .from("matches")
        .select("*")
        .eq("event_id", eventId)
        .order("display_order", { ascending: false })
        .returns<MatchRow[]>(),
      supabase
        .from("predictions")
        .select(
          "id,match_id,korea_score,opponent_score,created_at,participants(nickname,phone_last4,encrypted_phone,created_at),matches(title,actual_korea_score,actual_opponent_score)",
        )
        .eq("event_id", eventId)
        .order("created_at", { ascending: false })
        .returns<PredictionWithRelations[]>(),
    ]);

  if (matchesResult.error) {
    throw new Error("경기 데이터를 불러오지 못했습니다.");
  }

  if (predictionsResult.error) {
    throw new Error("예측 데이터를 불러오지 못했습니다.");
  }

  const predictions = predictionsResult.data ?? [];
  const matches = withMatchStats(matchesResult.data ?? [], predictions);
  const activeMatchId = resolveSelectedMatchId(matches, selectedMatchId);
  const participantsResult = activeMatchId
    ? await supabase
        .from("participants")
        .select("id,match_id,nickname,phone_last4,created_at")
        .eq("event_id", eventId)
        .eq("match_id", activeMatchId)
        .order("created_at", { ascending: false })
        .returns<
          Array<Pick<ParticipantRow, "id" | "match_id" | "nickname" | "phone_last4" | "created_at">>
        >()
    : await supabase
        .from("participants")
        .select("id,match_id,nickname,phone_last4,created_at")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false })
        .returns<
          Array<Pick<ParticipantRow, "id" | "match_id" | "nickname" | "phone_last4" | "created_at">>
        >();

  if (participantsResult.error) {
    throw new Error("참여자 데이터를 불러오지 못했습니다.");
  }

  const selectedPredictions = activeMatchId
    ? predictions.filter((prediction) => prediction.match_id === activeMatchId)
    : predictions;

  return {
    selectedMatchId: activeMatchId,
    participantCount: participantsResult.data?.length ?? 0,
    predictionCount: selectedPredictions.length,
    matches,
    participants: (participantsResult.data ?? []).slice(0, 20).map((participant) => ({
      id: participant.id,
      matchId: participant.match_id,
      nickname: participant.nickname,
      maskedPhone: maskPhoneLast4(participant.phone_last4),
      createdAt: participant.created_at,
    })),
    predictions: predictions.slice(0, 40).map((prediction) => ({
      id: prediction.id,
      nickname: prediction.participants?.nickname ?? "알 수 없음",
      maskedPhone: maskPhoneLast4(prediction.participants?.phone_last4 ?? ""),
      submittedAt: prediction.participants?.created_at ?? prediction.created_at,
      matchTitle: prediction.matches?.title ?? "경기 정보 없음",
      predictedScore: `${prediction.korea_score}:${prediction.opponent_score}`,
    })),
    winners: predictions.filter(isWinningPrediction).map((prediction) => ({
      id: prediction.id,
      nickname: prediction.participants?.nickname ?? "알 수 없음",
      maskedPhone: maskPhoneLast4(prediction.participants?.phone_last4 ?? ""),
      submittedAt: prediction.participants?.created_at ?? prediction.created_at,
      matchTitle: prediction.matches?.title ?? "경기 정보 없음",
      predictedScore: `${prediction.korea_score}:${prediction.opponent_score}`,
    })),
  };
}

function resolveSelectedMatchId(matches: AdminMatch[], requestedMatchId?: string) {
  if (requestedMatchId && matches.some((match) => match.id === requestedMatchId)) {
    return requestedMatchId;
  }

  return matches.find((match) => match.is_open)?.id ?? matches[0]?.id ?? null;
}

export async function getAdminMatches(): Promise<AdminMatch[]> {
  const supabase = createServiceSupabaseClient();
  const eventId = await getEventId(supabase);

  if (!eventId) {
    return [];
  }

  const [matchesResult, predictionsResult] = await Promise.all([
    supabase
      .from("matches")
      .select("*")
      .eq("event_id", eventId)
      .order("display_order", { ascending: true })
      .returns<MatchRow[]>(),
    supabase
      .from("predictions")
      .select("id,match_id,korea_score,opponent_score")
      .eq("event_id", eventId)
      .returns<Array<Pick<PredictionRow, "id" | "match_id" | "korea_score" | "opponent_score">>>(),
  ]);

  if (matchesResult.error) {
    throw new Error("경기 목록을 불러오지 못했습니다.");
  }

  if (predictionsResult.error) {
    throw new Error("경기별 예측 수를 불러오지 못했습니다.");
  }

  return withMatchStats(matchesResult.data ?? [], predictionsResult.data ?? []);
}

export async function setMatchOpen(matchId: string, isOpen: boolean) {
  const supabase = createServiceSupabaseClient();

  if (!isOpen) {
    const { error } = await supabase.from("matches").update({ is_open: false }).eq("id", matchId);

    if (error) {
      throw new Error("경기 상태를 변경하지 못했습니다.");
    }

    return;
  }

  const { data: targetMatch, error: targetError } = await supabase
    .from("matches")
    .select("event_id")
    .eq("id", matchId)
    .single()
    .returns<Pick<MatchRow, "event_id">>();

  if (targetError) {
    throw new Error("표시할 경기 정보를 찾지 못했습니다.");
  }

  const { error } = await supabase.from("matches").update({ is_open: true }).eq("id", matchId);

  if (error) {
    throw new Error("경기 상태를 변경하지 못했습니다.");
  }

  const { error: closeOthersError } = await supabase
    .from("matches")
    .update({ is_open: false })
    .eq("event_id", targetMatch.event_id)
    .neq("id", matchId);

  if (closeOthersError) {
    throw new Error("다른 경기를 숨기지 못했습니다.");
  }
}

export async function createMatch(input: {
  title: string;
  koreaTeamName: string;
  opponentTeamName: string;
  matchAt: string | null;
  predictionClosesAt: string | null;
}) {
  const supabase = createServiceSupabaseClient();
  const eventId = await getEventId(supabase);

  if (!eventId) {
    throw new Error("이벤트가 아직 생성되지 않았습니다.");
  }

  const { data: currentMatches, error: orderError } = await supabase
    .from("matches")
    .select("display_order")
    .eq("event_id", eventId)
    .order("display_order", { ascending: false })
    .limit(1)
    .returns<Array<Pick<MatchRow, "display_order">>>();

  if (orderError) {
    throw new Error("경기 순서를 확인하지 못했습니다.");
  }

  const nextDisplayOrder = (currentMatches?.[0]?.display_order ?? -1) + 1;
  const { data: createdMatch, error } = await supabase
    .from("matches")
    .insert({
      event_id: eventId,
      title: input.title,
      korea_team_name: input.koreaTeamName,
      opponent_team_name: input.opponentTeamName,
      match_at: input.matchAt,
      prediction_closes_at: input.predictionClosesAt,
      is_open: true,
      display_order: nextDisplayOrder,
    })
    .select("id")
    .single()
    .returns<Pick<MatchRow, "id">>();

  if (error) {
    throw new Error("경기를 추가하지 못했습니다.");
  }

  const { error: closeOthersError } = await supabase
    .from("matches")
    .update({ is_open: false })
    .eq("event_id", eventId)
    .neq("id", createdMatch.id);

  if (closeOthersError) {
    throw new Error("새 경기 외의 다른 경기를 숨기지 못했습니다.");
  }
}

export async function updateMatch(input: {
  id: string;
  title: string;
  koreaTeamName: string;
  opponentTeamName: string;
  matchAt: string | null;
  predictionClosesAt: string | null;
  actualKoreaScore: number | null;
  actualOpponentScore: number | null;
}) {
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase
    .from("matches")
    .update({
      title: input.title,
      korea_team_name: input.koreaTeamName,
      opponent_team_name: input.opponentTeamName,
      match_at: input.matchAt,
      prediction_closes_at: input.predictionClosesAt,
      actual_korea_score: input.actualKoreaScore,
      actual_opponent_score: input.actualOpponentScore,
    })
    .eq("id", input.id);

  if (error) {
    throw new Error("경기 정보를 수정하지 못했습니다.");
  }
}

export async function getAdminExportRows(): Promise<AdminPredictionRow[]> {
  const supabase = createServiceSupabaseClient();
  const eventId = await getEventId(supabase);

  if (!eventId) {
    return [];
  }

  const { data, error } = await supabase
    .from("predictions")
    .select(
      "id,match_id,korea_score,opponent_score,created_at,participants(nickname,phone_last4,encrypted_phone,created_at),matches(title,actual_korea_score,actual_opponent_score)",
    )
    .eq("event_id", eventId)
    .order("created_at", { ascending: true })
    .returns<PredictionWithRelations[]>();

  if (error) {
    throw new Error("CSV 데이터를 불러오지 못했습니다.");
  }

  return (data ?? []).filter(isWinningPrediction).map((prediction) => {
    const maskedPhone = maskPhoneLast4(prediction.participants?.phone_last4 ?? "");
    const decryptedPhone = decryptPhoneNumber(prediction.participants?.encrypted_phone ?? null);

    return {
      id: prediction.id,
      nickname: prediction.participants?.nickname ?? "알 수 없음",
      maskedPhone,
      exportPhone: formatPhoneForExport(decryptedPhone) ?? maskedPhone,
      submittedAt: prediction.participants?.created_at ?? prediction.created_at,
      matchTitle: prediction.matches?.title ?? "경기 정보 없음",
      predictedScore: `${prediction.korea_score}:${prediction.opponent_score}`,
    };
  });
}

async function getEventId(supabase: ReturnType<typeof createServiceSupabaseClient>) {
  const { data, error } = await supabase
    .from("events")
    .select("id")
    .eq("slug", EVENT_SLUG)
    .maybeSingle();

  if (error) {
    throw new Error("이벤트 정보를 불러오지 못했습니다.");
  }

  return data?.id ?? null;
}

function maskPhoneLast4(last4: string) {
  return last4 ? `010-****-${last4}` : "010-****-****";
}

function formatPhoneForExport(phone: string | null) {
  if (!phone || phone.length !== 11) {
    return null;
  }

  return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;
}

function withMatchStats<T extends Pick<PredictionRow, "match_id" | "korea_score" | "opponent_score">>(
  matches: MatchRow[],
  predictions: T[],
): AdminMatch[] {
  return matches.map((match) => {
    const matchPredictions = predictions.filter((prediction) => prediction.match_id === match.id);
    const hasActualScore =
      match.actual_korea_score !== null && match.actual_opponent_score !== null;

    return {
      ...match,
      predictionCount: matchPredictions.length,
      winnerCount: hasActualScore
        ? matchPredictions.filter(
            (prediction) =>
              prediction.korea_score === match.actual_korea_score &&
              prediction.opponent_score === match.actual_opponent_score,
          ).length
        : 0,
    };
  });
}

function isWinningPrediction(prediction: PredictionWithRelations) {
  return (
    prediction.matches?.actual_korea_score !== null &&
    prediction.matches?.actual_korea_score !== undefined &&
    prediction.matches?.actual_opponent_score !== null &&
    prediction.matches?.actual_opponent_score !== undefined &&
    prediction.korea_score === prediction.matches.actual_korea_score &&
    prediction.opponent_score === prediction.matches.actual_opponent_score
  );
}

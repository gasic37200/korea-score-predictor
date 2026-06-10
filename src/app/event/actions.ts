"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { z } from "zod";
import { encryptPhoneNumber, hashPhoneNumber } from "@/lib/crypto";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { koreanMobilePhoneSchema, scoreSchema } from "@/lib/validation";

export type EventSubmitState = {
  status: "idle" | "error" | "ready";
  message: string;
  values?: {
    nickname: string;
    phone: string;
    privacyAgreed: boolean;
    predictions: Array<{
      koreaScore: string;
      opponentScore: string;
    }>;
  };
};

const baseSchema = z.object({
  eventSlug: z.string().min(1, "이벤트 정보가 올바르지 않습니다."),
  matchCount: z.coerce.number().int().min(1, "예측할 경기가 없습니다.").max(20),
  nickname: z
    .string()
    .trim()
    .min(1, "닉네임을 입력해 주세요.")
    .max(30, "닉네임은 30자 이내로 입력해 주세요."),
  phone: koreanMobilePhoneSchema,
  privacyAgreed: z.literal("on", {
    errorMap: () => ({ message: "개인정보 안내에 동의해 주세요." }),
  }),
});

type OpenMatch = {
  id: string;
  event_id: string;
  display_order: number;
  prediction_closes_at: string | null;
};

export async function submitPredictions(
  _previousState: EventSubmitState,
  formData: FormData,
): Promise<EventSubmitState> {
  const submittedValues = getSubmittedValues(formData);

  try {
    const parsed = baseSchema.safeParse({
      eventSlug: formData.get("eventSlug"),
      matchCount: formData.get("matchCount"),
      nickname: formData.get("nickname"),
      phone: formData.get("phone"),
      privacyAgreed: formData.get("privacyAgreed"),
    });

    if (!parsed.success) {
      return {
        status: "error",
        message: parsed.error.issues[0]?.message ?? "입력값을 다시 확인해 주세요.",
        values: submittedValues,
      };
    }

    const predictions = parsePredictions(formData, parsed.data.matchCount);
    if (!predictions.success) {
      return predictions.error;
    }

    const supabase = createServiceSupabaseClient();
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id")
      .eq("slug", parsed.data.eventSlug)
      .eq("is_open", true)
      .limit(1);

    if (eventError) {
      return {
        status: "error",
        message: `이벤트 정보를 불러오지 못했습니다. Supabase 설정 또는 SQL 적용 상태를 확인해 주세요. (${eventError.message})`,
        values: submittedValues,
      };
    }

    const eventId = event?.[0]?.id;

    if (!eventId) {
      return {
        status: "error",
        message: "현재 참여 가능한 이벤트가 없습니다. 관리자에서 이벤트와 경기가 열려 있는지 확인해 주세요.",
        values: submittedValues,
      };
    }

    const { data: matches, error: matchesError } = await supabase
      .from("matches")
      .select("id,event_id,display_order,prediction_closes_at")
      .eq("event_id", eventId)
      .eq("is_open", true)
      .order("display_order", { ascending: true });

    if (matchesError) {
      return {
        status: "error",
        message: `경기 정보를 불러오지 못했습니다. (${matchesError.message})`,
        values: submittedValues,
      };
    }

    const openMatches = (matches ?? []) as OpenMatch[];

    if (openMatches.length < predictions.data.length) {
      return {
        status: "error",
        message: "예측 가능한 경기 정보가 부족합니다. 관리자에서 열린 경기를 확인해 주세요.",
        values: submittedValues,
      };
    }

    const expiredMatch = openMatches.find(
      (match) =>
        match.prediction_closes_at &&
        new Date(match.prediction_closes_at).getTime() <= Date.now(),
    );

    if (expiredMatch) {
      return {
        status: "error",
        message: "예측 가능 시간이 지난 경기가 있어 제출할 수 없습니다.",
        values: submittedValues,
      };
    }

    const phoneHash = hashPhoneNumber(parsed.data.phone);
    const phoneLast4 = parsed.data.phone.slice(-4);
    const encryptedPhone = encryptPhoneNumber(parsed.data.phone);

    const matchPredictions = predictions.data.map((prediction, index) => ({
      match: openMatches[index],
      prediction,
    }));
    const matchIds = matchPredictions.map(({ match }) => match.id);

    const { data: duplicateParticipants, error: duplicateError } = await supabase
      .from("participants")
      .select("id")
      .eq("phone_hash", phoneHash)
      .in("match_id", matchIds)
      .limit(1);

    if (duplicateError) {
      return {
        status: "error",
        message: `참여 이력을 확인하지 못했습니다. (${duplicateError.message})`,
        values: submittedValues,
      };
    }

    if ((duplicateParticipants ?? []).length > 0) {
      return {
        status: "error",
        message: "이미 이 경기에 참여한 휴대폰 번호입니다. 다른 경기는 다시 참여할 수 있습니다.",
        values: submittedValues,
      };
    }

    const { data: participants, error: participantError } = await supabase
      .from("participants")
      .insert(
        matchPredictions.map(({ match }) => ({
          event_id: eventId,
          match_id: match.id,
          nickname: parsed.data.nickname,
          phone_hash: phoneHash,
          phone_last4: phoneLast4,
          encrypted_phone: encryptedPhone,
        })),
      )
      .select("id,match_id");

    if (participantError) {
      if (participantError.code === "23505") {
        return {
          status: "error",
          message: "이미 이 경기에 참여한 휴대폰 번호입니다. 다른 경기는 다시 참여할 수 있습니다.",
          values: submittedValues,
        };
      }

      return {
        status: "error",
        message: `참여자 정보를 저장하지 못했습니다. (${participantError.message})`,
        values: submittedValues,
      };
    }

    const participantByMatchId = new Map(
      (participants ?? []).map((participant) => [participant.match_id, participant.id]),
    );
    const missingParticipant = matchPredictions.some(({ match }) => !participantByMatchId.has(match.id));

    if (missingParticipant) {
      await supabase
        .from("participants")
        .delete()
        .in(
          "id",
          (participants ?? []).map((participant) => participant.id),
        );

      return {
        status: "error",
        message: "참여자와 경기 정보를 연결하지 못했습니다. 다시 시도해 주세요.",
        values: submittedValues,
      };
    }

    const predictionRows = matchPredictions.map(({ match, prediction }) => ({
      event_id: eventId,
      participant_id: participantByMatchId.get(match.id) as string,
      match_id: match.id,
      korea_score: prediction.koreaScore,
      opponent_score: prediction.opponentScore,
    }));

    const { error: predictionsError } = await supabase
      .from("predictions")
      .insert(predictionRows);

    if (predictionsError) {
      await supabase
        .from("participants")
        .delete()
        .in(
          "id",
          (participants ?? []).map((participant) => participant.id),
        );

      return {
        status: "error",
        message: "예측 점수를 저장하지 못했습니다.",
        values: submittedValues,
      };
    }

    redirect("/result");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    if (error instanceof Error && error.message.includes("environment variables")) {
      return {
        status: "error",
        message: "서버 환경 변수가 아직 설정되지 않았습니다. 관리자에게 문의해 주세요.",
        values: submittedValues,
      };
    }

    if (error instanceof Error && error.message.includes("PHONE_HASH_SECRET")) {
      return {
        status: "error",
        message: "휴대폰 해시 secret이 아직 설정되지 않았습니다. 관리자에게 문의해 주세요.",
        values: submittedValues,
      };
    }

    return {
      status: "error",
      message: "제출 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      values: submittedValues,
    };
  }
}

function parsePredictions(formData: FormData, matchCount: number) {
  const predictions: Array<{ koreaScore: number; opponentScore: number }> = [];

  for (let index = 0; index < matchCount; index += 1) {
    const koreaScore = scoreSchema.safeParse(formData.get(`predictions.${index}.koreaScore`));
    const opponentScore = scoreSchema.safeParse(
      formData.get(`predictions.${index}.opponentScore`),
    );

    if (!koreaScore.success) {
      return {
        success: false as const,
        error: {
          status: "error" as const,
          message: koreaScore.error.issues[0]?.message ?? "대한민국 점수를 확인해 주세요.",
          values: getSubmittedValues(formData),
        },
      };
    }

    if (!opponentScore.success) {
      return {
        success: false as const,
        error: {
          status: "error" as const,
          message: opponentScore.error.issues[0]?.message ?? "상대팀 점수를 확인해 주세요.",
          values: getSubmittedValues(formData),
        },
      };
    }

    predictions.push({
      koreaScore: koreaScore.data,
      opponentScore: opponentScore.data,
    });
  }

  return { success: true as const, data: predictions };
}

function getSubmittedValues(formData: FormData) {
  const matchCount = Number(formData.get("matchCount") ?? 0);

  return {
    nickname: String(formData.get("nickname") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    privacyAgreed: formData.get("privacyAgreed") === "on",
    predictions: Array.from({ length: Number.isFinite(matchCount) ? matchCount : 0 }, (_, index) => ({
      koreaScore: String(formData.get(`predictions.${index}.koreaScore`) ?? ""),
      opponentScore: String(formData.get(`predictions.${index}.opponentScore`) ?? ""),
    })),
  };
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  clearAdminSession,
  createAdminSession,
  isAdminAuthenticated,
  verifyAdminPassword,
} from "@/lib/auth";
import {
  createMatch as createMatchRow,
  setMatchOpen,
  updateMatch as updateMatchRow,
} from "@/lib/admin";

export type AdminLoginState = {
  status: "idle" | "error";
  message: string;
};

export async function loginAdmin(
  _previousState: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const password = String(formData.get("password") ?? "");

  if (!password) {
    return { status: "error", message: "관리자 비밀번호를 입력해 주세요." };
  }

  const verified = await verifyAdminPassword(password);

  if (!verified) {
    return { status: "error", message: "관리자 비밀번호가 올바르지 않습니다." };
  }

  await createAdminSession();
  redirect("/admin");
}

export async function logoutAdmin() {
  await clearAdminSession();
  redirect("/admin");
}

export async function toggleMatchOpen(formData: FormData) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin");
  }

  let notice = "";

  try {
    const matchId = String(formData.get("matchId") ?? "");
    const isOpen = String(formData.get("isOpen") ?? "") === "true";

    if (!matchId) {
      throw new Error("경기 정보가 올바르지 않습니다.");
    }

    await setMatchOpen(matchId, isOpen);
    revalidateAdminMatchPaths();
    notice = isOpen
      ? "경기를 이벤트 페이지에 표시했습니다. 다른 경기는 자동으로 숨겼습니다."
      : "경기를 숨겼습니다.";
  } catch (error) {
    redirectWithError(error);
  }

  redirectWithNotice(notice);
}

export async function createMatchAction(formData: FormData) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin");
  }

  let notice = "";

  try {
    await createMatchRow({
      title: requiredString(formData, "title", "경기 제목을 입력해 주세요."),
      koreaTeamName: requiredString(formData, "koreaTeamName", "대한민국 팀명을 입력해 주세요."),
      opponentTeamName: requiredString(formData, "opponentTeamName", "상대팀을 입력해 주세요."),
      matchAt: dateTimeOrNull(formData.get("matchAt")),
      predictionClosesAt: dateTimeOrNull(formData.get("predictionClosesAt")),
    });

    revalidateAdminMatchPaths();
    notice = "새 경기를 추가했습니다. 새 경기만 이벤트 페이지에 표시됩니다.";
  } catch (error) {
    redirectWithError(error);
  }

  redirectWithNotice(notice, "manage");
}

export async function updateMatchAction(formData: FormData) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin");
  }

  let notice = "";

  try {
    await updateMatchRow({
      id: requiredString(formData, "matchId", "경기 정보가 올바르지 않습니다."),
      title: requiredString(formData, "title", "경기 제목을 입력해 주세요."),
      koreaTeamName: requiredString(formData, "koreaTeamName", "대한민국 팀명을 입력해 주세요."),
      opponentTeamName: requiredString(formData, "opponentTeamName", "상대팀을 입력해 주세요."),
      matchAt: dateTimeOrNull(formData.get("matchAt")),
      predictionClosesAt: dateTimeOrNull(formData.get("predictionClosesAt")),
      actualKoreaScore: optionalScore(formData.get("actualKoreaScore")),
      actualOpponentScore: optionalScore(formData.get("actualOpponentScore")),
    });

    revalidateAdminMatchPaths();
    notice = "경기 정보를 수정했습니다.";
  } catch (error) {
    redirectWithError(error);
  }

  redirectWithNotice(notice);
}

function revalidateAdminMatchPaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/matches");
  revalidatePath("/event");
  revalidatePath("/result");
}

function requiredString(formData: FormData, key: string, message: string) {
  const value = String(formData.get(key) ?? "").trim();

  if (!value) {
    throw new Error(message);
  }

  return value;
}

function dateTimeOrNull(value: FormDataEntryValue | null) {
  const dateTime = String(value ?? "");

  if (!dateTime) {
    return null;
  }

  return new Date(dateTime).toISOString();
}

function optionalScore(value: FormDataEntryValue | null) {
  const rawValue = String(value ?? "");

  if (!rawValue) {
    return null;
  }

  const parsed = Number(rawValue);

  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 20) {
    throw new Error("실제 경기 결과는 0점 이상 20점 이하 정수로 입력해 주세요.");
  }

  return parsed;
}

function redirectWithNotice(message: string, tab: "create" | "manage" = "manage"): never {
  redirect(`/admin/matches?tab=${tab}&notice=${encodeURIComponent(message)}`);
}

function redirectWithError(error: unknown): never {
  const message = error instanceof Error ? error.message : "경기 관리 작업에 실패했습니다.";
  redirect(`/admin/matches?tab=manage&error=${encodeURIComponent(message)}`);
}

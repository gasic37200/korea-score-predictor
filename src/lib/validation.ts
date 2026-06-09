import { z } from "zod";

export function normalizeKoreanMobilePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

export function formatKoreanMobilePhone(phone: string) {
  const digits = normalizeKoreanMobilePhone(phone).slice(0, 11);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }

  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export const koreanMobilePhoneSchema = z
  .string()
  .transform(normalizeKoreanMobilePhone)
  .refine((value) => /^010\d{8}$/.test(value), {
    message: "010으로 시작하는 11자리 휴대폰 번호를 입력해 주세요.",
  });

export const scoreSchema = z.coerce
  .number()
  .int("점수는 정수여야 합니다.")
  .min(0, "점수는 0점 이상이어야 합니다.")
  .max(20, "점수는 20점 이하여야 합니다.");

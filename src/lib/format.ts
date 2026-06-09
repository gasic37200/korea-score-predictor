export function maskKoreanPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const last4 = digits.slice(-4);

  if (digits.length < 10 || digits.length > 11) {
    return "전화번호 형식 오류";
  }

  return `010-****-${last4}`;
}

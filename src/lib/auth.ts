import "server-only";

import { cookies } from "next/headers";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const ADMIN_COOKIE_NAME = "ksp_admin";

export function hashAdminPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

export function isAdminConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD_HASH);
}

export async function verifyAdminPassword(password: string) {
  const expectedHash = process.env.ADMIN_PASSWORD_HASH;

  if (!expectedHash) {
    return false;
  }

  return safeEqual(hashAdminPassword(password), expectedHash);
}

export async function createAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, createAdminToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: 60 * 60 * 6,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!token || !process.env.ADMIN_PASSWORD_HASH) {
    return false;
  }

  return safeEqual(token, createAdminToken());
}

function createAdminToken() {
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!passwordHash) {
    return "";
  }

  return createHmac("sha256", passwordHash).update("korea-score-predictor-admin").digest("hex");
}

function safeEqual(value: string, expected: string) {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);

  if (valueBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(valueBuffer, expectedBuffer);
}

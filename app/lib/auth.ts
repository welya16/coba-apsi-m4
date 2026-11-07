import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { ApiError } from "@/app/lib/api";
import { prisma } from "@/app/lib/prisma";

export const sessionCookieName = "jk_session";
const sessionLifetimeSeconds = 60 * 60 * 24 * 7;

export type AuthUser = {
  id_akun: string;
  username: string;
  nama_lengkap: string;
  role: string;
};

function authSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET wajib diatur dengan nilai acak minimal 32 karakter.");
  }
  return secret;
}

function signature(payload: string): string {
  return createHmac("sha256", authSecret()).update(payload).digest("base64url");
}

export function createPasswordHash(password: string): string {
  const salt = randomBytes(12).toString("base64url");
  const digest = scryptSync(password, salt, 48).toString("base64url");
  return `scrypt$${salt}$${digest}`;
}

function safeEqual(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && timingSafeEqual(a, b);
}

export function verifyPassword(password: string, stored: string): { valid: boolean; needsRehash: boolean } {
  const [scheme, salt, encodedDigest] = stored.split("$");
  if (scheme === "scrypt" && salt && encodedDigest) {
    try {
      const expected = Buffer.from(encodedDigest, "base64url");
      const actual = scryptSync(password, salt, expected.length);
      return { valid: safeEqual(actual, expected), needsRehash: false };
    } catch {
      return { valid: false, needsRehash: false };
    }
  }

  const provided = Buffer.from(password);
  const legacy = Buffer.from(stored);
  return { valid: safeEqual(provided, legacy), needsRehash: true };
}

export function createSessionToken(accountId: string): string {
  const payload = Buffer.from(JSON.stringify({
    id_akun: accountId,
    exp: Math.floor(Date.now() / 1000) + sessionLifetimeSeconds,
  })).toString("base64url");
  return `${payload}.${signature(payload)}`;
}

function readSessionToken(token: string): string | null {
  const [payload, providedSignature, extra] = token.split(".");
  if (!payload || !providedSignature || extra) return null;
  const expected = Buffer.from(signature(payload));
  const actual = Buffer.from(providedSignature);
  if (!safeEqual(actual, expected)) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      id_akun?: unknown;
      exp?: unknown;
    };
    if (typeof decoded.id_akun !== "string" || typeof decoded.exp !== "number" ||
        decoded.exp <= Math.floor(Date.now() / 1000)) return null;
    return decoded.id_akun;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;
  if (!token) return null;
  const accountId = readSessionToken(token);
  if (!accountId) return null;
  return prisma.akun.findUnique({
    where: { id_akun: accountId },
    select: { id_akun: true, username: true, nama_lengkap: true, role: true },
  });
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) throw new ApiError("Silakan masuk terlebih dahulu.", 401);
  return user;
}

export function normalizeRole(role: string): string {
  const normalized = role.trim().toLowerCase();
  return normalized === "kurir" ? "pengiriman" : normalized;
}

export function requireRole(user: AuthUser, allowedRoles: string[]): void {
  if (!allowedRoles.includes(normalizeRole(user.role))) {
    throw new ApiError("Anda tidak memiliki izin untuk melakukan tindakan ini.", 403);
  }
}

export async function getCustomerId(accountId: string): Promise<string> {
  const customer = await prisma.pelanggan.findFirst({
    where: { id_akun: accountId },
    select: { id_pelanggan: true },
  });
  if (!customer) throw new ApiError("Profil pelanggan tidak ditemukan.", 403);
  return customer.id_pelanggan;
}

export function setSessionCookie(response: NextResponse, request: Request, accountId: string): void {
  const secure = process.env.AUTH_COOKIE_SECURE === "true" ||
    request.url.startsWith("https://") ||
    request.headers.get("x-forwarded-proto")?.split(",")[0].trim() === "https";
  response.cookies.set(sessionCookieName, createSessionToken(accountId), {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: sessionLifetimeSeconds,
  });
}

export function clearSessionCookie(response: NextResponse, request: Request): void {
  const secure = process.env.AUTH_COOKIE_SECURE === "true" ||
    request.url.startsWith("https://") ||
    request.headers.get("x-forwarded-proto")?.split(",")[0].trim() === "https";
  response.cookies.set(sessionCookieName, "", {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

import { NextResponse } from "next/server";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function runApi(
  action: () => Promise<Response | unknown>,
): Promise<Response> {
  try {
    const result = await action();
    return result instanceof Response ? result : NextResponse.json(result);
  } catch (error) {
    const digest = error && typeof error === "object" && "digest" in error
      ? String(error.digest)
      : "";
    if (digest === "HANGING_PROMISE_REJECTION" || digest === "DYNAMIC_SERVER_USAGE") {
      throw error;
    }
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const code = error && typeof error === "object" && "code" in error
      ? String(error.code)
      : "";
    if (code === "P2002") {
      return NextResponse.json({ error: "Data dengan nilai tersebut sudah terdaftar." }, { status: 409 });
    }
    if (code === "P2025") {
      return NextResponse.json({ error: "Data tidak ditemukan." }, { status: 404 });
    }
    if (code === "P2003") {
      return NextResponse.json({ error: "Perubahan ditolak karena data masih digunakan." }, { status: 409 });
    }

    console.error("API request failed:", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  let value: unknown;
  try {
    value = await request.json();
  } catch {
    throw new ApiError("Isi permintaan harus berupa JSON yang valid.", 400);
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ApiError("Isi permintaan harus berupa objek JSON.", 400);
  }
  return value as Record<string, unknown>;
}

export function stringField(
  body: Record<string, unknown>,
  key: string,
  options: { required?: boolean; max?: number } = {},
): string | null {
  const value = body[key];
  if (value === undefined || value === null || value === "") {
    if (options.required) throw new ApiError(`${key} wajib diisi.`, 400);
    return null;
  }
  if (typeof value !== "string") {
    throw new ApiError(`${key} harus berupa teks.`, 400);
  }
  const normalized = value.trim();
  if (!normalized && options.required) throw new ApiError(`${key} wajib diisi.`, 400);
  if (options.max && normalized.length > options.max) {
    throw new ApiError(`${key} maksimal ${options.max} karakter.`, 400);
  }
  return normalized || null;
}

export function numberField(
  body: Record<string, unknown>,
  key: string,
  options: { required?: boolean; min?: number; max?: number } = {},
): number | null {
  const value = body[key];
  if (value === undefined || value === null || value === "") {
    if (options.required) throw new ApiError(`${key} wajib diisi.`, 400);
    return null;
  }
  const number = Number(value);
  if (!Number.isFinite(number) || (options.min !== undefined && number < options.min) ||
      (options.max !== undefined && number > options.max)) {
    throw new ApiError(`${key} tidak valid.`, 400);
  }
  return number;
}

export function dateField(value: unknown, key: string): Date | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ApiError(`${key} harus menggunakan format YYYY-MM-DD.`, 400);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new ApiError(`${key} bukan tanggal yang valid.`, 400);
  }
  return date;
}

export function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
}

import { NextResponse } from "next/server";
import { runApi } from "@/app/lib/api";
import { clearSessionCookie } from "@/app/lib/auth";

export async function POST(request: Request) {
  return runApi(async () => {
    const response = NextResponse.json({ success: true });
    clearSessionCookie(response, request);
    return response;
  });
}

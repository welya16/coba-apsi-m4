import { NextResponse } from "next/server";
import { ApiError, readJson, runApi, stringField } from "@/app/lib/api";
import { createPasswordHash, requireUser, verifyPassword } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function PATCH(request: Request) {
  return runApi(async () => {
    const user = await requireUser();
    const body = await readJson(request);
    const oldPassword = stringField(body, "old_password", { required: true, max: 128 })!;
    const newPassword = stringField(body, "new_password", { required: true, max: 128 })!;
    if (newPassword.length < 10) throw new ApiError("Kata sandi baru minimal 10 karakter.", 400);
    const account = await prisma.akun.findUnique({ where: { id_akun: user.id_akun } });
    if (!account || !verifyPassword(oldPassword, account.password).valid) {
      throw new ApiError("Kata sandi saat ini tidak sesuai.", 403);
    }
    await prisma.akun.update({
      where: { id_akun: user.id_akun },
      data: { password: createPasswordHash(newPassword) },
    });
    return NextResponse.json({ success: true });
  });
}

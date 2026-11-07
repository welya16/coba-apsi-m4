import { NextResponse } from "next/server";
import { createId, numberField, readJson, runApi, stringField } from "@/app/lib/api";
import { requireRole, requireUser } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET(request: Request) {
  return runApi(async () => {
    await requireUser();
    const query = new URL(request.url).searchParams.get("q")?.trim();
    const data = await prisma.produk.findMany({
      where: query ? {
        OR: [
          { nama_produk: { contains: query, mode: "insensitive" } },
          { jenis: { contains: query, mode: "insensitive" } },
          { bahan: { contains: query, mode: "insensitive" } },
        ],
      } : undefined,
      orderBy: { nama_produk: "asc" },
    });
    return { data };
  });
}

export async function POST(request: Request) {
  return runApi(async () => {
    const user = await requireUser();
    requireRole(user, ["admin"]);
    const body = await readJson(request);
    const name = stringField(body, "nama_produk", { required: true, max: 50 })!;
    const category = stringField(body, "jenis", { required: true, max: 50 })!;
    const price = numberField(body, "harga_dasar", { required: true, min: 0 })!;
    const data = await prisma.produk.create({
      data: {
        id_produk: createId("PRD"),
        nama_produk: name,
        jenis: category,
        harga_dasar: price,
        bahan: stringField(body, "bahan", { max: 100 }),
        deskripsi: stringField(body, "deskripsi"),
        status_tersedia: stringField(body, "status_tersedia", { max: 30 }) ?? "Tersedia",
      },
    });
    return NextResponse.json({ data }, { status: 201 });
  });
}

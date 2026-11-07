import { ApiError, runApi } from "@/app/lib/api";
import { requireUser } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET(request: Request) {
  return runApi(async () => {
    await requireUser();
    const query = new URL(request.url).searchParams.get("q")?.trim();
    if (!query || query.length < 2) throw new ApiError("Masukkan minimal 2 karakter untuk mencari kode pos.", 400);
    const data = await prisma.kode_pos.findMany({
      where: {
        OR: [
          { kode_pos: { contains: query } },
          { kelurahan: { contains: query, mode: "insensitive" } },
          { kecamatan: { contains: query, mode: "insensitive" } },
          { kota: { contains: query, mode: "insensitive" } },
          { provinsi: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: [{ kota: "asc" }, { kecamatan: "asc" }],
      take: 20,
    });
    return { data };
  });
}

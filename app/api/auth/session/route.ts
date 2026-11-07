import { runApi } from "@/app/lib/api";
import { getCurrentUser } from "@/app/lib/auth";

export async function GET() {
  return runApi(async () => ({ user: await getCurrentUser() }));
}

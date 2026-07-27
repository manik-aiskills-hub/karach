import { NextResponse } from "next/server";
import { getDemoUser } from "@/lib/demoUser";
import { getDashboardSummary } from "@/features/dashboard/server/dashboard.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getDemoUser();
  const { searchParams } = new URL(req.url);
  const home = searchParams.get("home") || "USD";
  return NextResponse.json(await getDashboardSummary(user.id, home));
}

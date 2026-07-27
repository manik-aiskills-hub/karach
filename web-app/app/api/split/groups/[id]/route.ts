import { NextResponse } from "next/server";
import { getDemoUser } from "@/lib/demoUser";
import { getGroup, getGroupBalances } from "@/features/split/server/split.service";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await getDemoUser();
  const { searchParams } = new URL(req.url);
  const home = searchParams.get("home") || "USD";
  const group = await getGroup(user.id, params.id);
  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const balances = await getGroupBalances(params.id, home);
  return NextResponse.json({ ...group, balances });
}

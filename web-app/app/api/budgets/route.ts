import { NextResponse } from "next/server";
import { getDemoUser } from "@/lib/demoUser";
import { listBudgetsForMonth, upsertBudget } from "@/features/budgets/server/budgets.service";
import { z } from "zod";

const createSchema = z.object({
  categoryId: z.string(),
  amount: z.number().positive(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000),
});

export async function GET(req: Request) {
  const user = await getDemoUser();
  const { searchParams } = new URL(req.url);
  const month = Number(searchParams.get("month")) || new Date().getMonth() + 1;
  const year = Number(searchParams.get("year")) || new Date().getFullYear();
  const home = searchParams.get("home") || "USD";
  return NextResponse.json(await listBudgetsForMonth(user.id, month, year, home));
}

export async function POST(req: Request) {
  const user = await getDemoUser();
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const budget = await upsertBudget(user.id, parsed.data);
  return NextResponse.json(budget, { status: 201 });
}

import { NextResponse } from "next/server";
import { getDemoUser } from "@/lib/demoUser";
import { addExpense } from "@/features/split/server/split.service";
import { z } from "zod";

const schema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().min(1),
  paidById: z.string().min(1),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getDemoUser();
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  try {
    const expense = await addExpense(user.id, params.id, parsed.data);
    return NextResponse.json(expense, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

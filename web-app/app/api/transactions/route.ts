import { NextResponse } from "next/server";
import { getDemoUser } from "@/lib/demoUser";
import { listTransactions, createTransaction } from "@/features/transactions/server/transactions.service";
import { z } from "zod";

const createSchema = z.object({
  categoryId: z.string(),
  amount: z.number().positive(),
  currency: z.string().min(1),
  direction: z.enum(["DEBIT", "CREDIT"]),
  date: z.string(),
  notes: z.string().optional(),
  fromAccountId: z.string().optional(),
  toAccountId: z.string().optional(),
});

export async function GET() {
  const user = await getDemoUser();
  return NextResponse.json(await listTransactions(user.id));
}

export async function POST(req: Request) {
  const user = await getDemoUser();
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const t = await createTransaction(user.id, parsed.data);
  return NextResponse.json(t, { status: 201 });
}

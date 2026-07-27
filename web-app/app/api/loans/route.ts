import { NextResponse } from "next/server";
import { getDemoUser } from "@/lib/demoUser";
import { listLoans, createLoan } from "@/features/loans/server/loans.service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  direction: z.enum(["TAKEN", "GIVEN"]),
  counterparty: z.string().min(1),
  currency: z.string().min(1),
  principal: z.number().positive(),
  interestRate: z.number().min(0).optional(),
  minPayment: z.number().min(0).optional(),
  startDate: z.string(),
});

export async function GET() {
  const user = await getDemoUser();
  return NextResponse.json(await listLoans(user.id));
}

export async function POST(req: Request) {
  const user = await getDemoUser();
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const loan = await createLoan(user.id, parsed.data);
  return NextResponse.json(loan, { status: 201 });
}

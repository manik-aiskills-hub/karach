import { NextResponse } from "next/server";
import { getDemoUser } from "@/lib/demoUser";
import { recordPayment } from "@/features/loans/server/loans.service";
import { z } from "zod";

const schema = z.object({
  amount: z.number().positive(),
  date: z.string().optional(),
  note: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getDemoUser();
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const payment = await recordPayment(user.id, params.id, parsed.data);
    return NextResponse.json(payment, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Loan not found" }, { status: 404 });
  }
}

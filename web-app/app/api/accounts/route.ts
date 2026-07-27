import { NextResponse } from "next/server";
import { getDemoUser } from "@/lib/demoUser";
import { listAccounts, createAccount } from "@/features/accounts/server/accounts.service";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  institution: z.string().optional(),
  type: z.enum(["CHECKING", "SAVINGS", "CASH", "INVESTMENT", "CREDIT"]),
  currency: z.string().min(1),
  balance: z.number(),
  location: z.string().optional(),
  number: z.string().optional(),
  ifsc: z.string().optional(),
  logPass: z.string().optional(),
  tranPass: z.string().optional(),
});

export async function GET() {
  const user = await getDemoUser();
  return NextResponse.json(await listAccounts(user.id));
}

export async function POST(req: Request) {
  const user = await getDemoUser();
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const account = await createAccount(user.id, parsed.data);
  return NextResponse.json(account, { status: 201 });
}

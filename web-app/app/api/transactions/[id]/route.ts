import { NextResponse } from "next/server";
import { getDemoUser } from "@/lib/demoUser";
import { deleteTransaction } from "@/features/transactions/server/transactions.service";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await getDemoUser();
  await deleteTransaction(user.id, params.id);
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { getDemoUser } from "@/lib/demoUser";
import { deleteAccount } from "@/features/accounts/server/accounts.service";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await getDemoUser();
  await deleteAccount(user.id, params.id);
  return NextResponse.json({ ok: true });
}

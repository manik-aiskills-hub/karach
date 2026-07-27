import { NextResponse } from "next/server";
import { getDemoUser } from "@/lib/demoUser";
import { addMember } from "@/features/split/server/split.service";
import { z } from "zod";

const schema = z.object({ name: z.string().min(1) });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getDemoUser();
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  try {
    const member = await addMember(user.id, params.id, parsed.data.name);
    return NextResponse.json(member, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

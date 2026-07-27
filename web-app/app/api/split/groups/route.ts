import { NextResponse } from "next/server";
import { getDemoUser } from "@/lib/demoUser";
import { listGroups, createGroup } from "@/features/split/server/split.service";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["GROUP", "DIRECT"]),
  friendName: z.string().min(1),
});

export async function GET() {
  const user = await getDemoUser();
  return NextResponse.json(await listGroups(user.id));
}

export async function POST(req: Request) {
  const user = await getDemoUser();
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const group = await createGroup(user.id, parsed.data);
  return NextResponse.json(group, { status: 201 });
}

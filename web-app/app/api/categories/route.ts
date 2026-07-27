import { NextResponse } from "next/server";
import { getDemoUser } from "@/lib/demoUser";
import { listCategories, createCategory } from "@/features/budgets/server/categories.service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().min(1),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export async function GET() {
  const user = await getDemoUser();
  return NextResponse.json(await listCategories(user.id));
}

export async function POST(req: Request) {
  const user = await getDemoUser();
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const category = await createCategory(user.id, parsed.data);
  return NextResponse.json(category, { status: 201 });
}

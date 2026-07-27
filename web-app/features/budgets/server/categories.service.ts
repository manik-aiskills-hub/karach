import { prisma } from "@/lib/prisma";

export async function listCategories(userId: string) {
  return prisma.category.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
}

export async function createCategory(
  userId: string,
  data: { name: string; icon?: string; color?: string }
) {
  return prisma.category.create({ data: { ...data, userId } });
}

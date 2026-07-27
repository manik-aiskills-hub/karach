import { prisma } from "./prisma";

// NOTE: Real authentication (NextAuth) is a separate feature we'll add
// on top of this foundation. Until then, every request is scoped to a
// single seeded demo user so the data model behaves exactly like the
// multi-user version will later (everything is already userId-scoped).
export async function getDemoUser() {
  const email = "demo@financeapp.local";
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({ data: { email, name: "Demo User" } });
  }
  return user;
}

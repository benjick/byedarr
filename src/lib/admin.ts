import crypto from "crypto";
import { and, eq } from "drizzle-orm";

import { db } from "../db";
import { admins } from "../db/schema/admins";

export async function isAdmin(discordUserId: string) {
  const res = await db.query.admins.findFirst({
    where: (table) =>
      and(eq(table.discordUserId, discordUserId), eq(table.isAdmin, true)),
  });
  return !!res;
}

export async function getAdminOtp(discordUserId: string) {
  const res = await db.query.admins.findFirst({
    where: eq(admins.discordUserId, discordUserId),
  });
  return res?.otp;
}

export async function wantsAdmin(discordUserId: string) {
  const otp = crypto.randomBytes(32).toString("hex");
  const [newAdmin] = await db
    .insert(admins)
    .values({ discordUserId, otp })
    .onConflictDoUpdate({
      target: [admins.discordUserId],
      set: { otp },
    })
    .returning();
  return newAdmin;
}

export async function approveAdmin(discordUserId: string) {
  await db
    .update(admins)
    .set({ isAdmin: true })
    .where(eq(admins.discordUserId, discordUserId));
}

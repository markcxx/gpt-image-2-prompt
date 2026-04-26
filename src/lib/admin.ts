import { cookies } from "next/headers";

import { getAdminCookieName, verifyAdminSession } from "@/lib/auth";

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getAdminCookieName())?.value;
  return await verifyAdminSession(token);
}

export async function isAdminAuthed() {
  const session = await getAdminSession();
  return Boolean(session);
}

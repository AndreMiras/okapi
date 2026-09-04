import { NextResponse } from "next/server";

import { COOKIE, getSession } from "@/lib/auth/session";
import { myKids } from "@/lib/mykids/client";

export async function POST() {
  const session = await getSession();
  if (session?.authToken)
    await myKids.logout(session.authToken).catch(() => undefined);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE, "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });
  return response;
}

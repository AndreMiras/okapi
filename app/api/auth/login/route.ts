import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { encodeSession, sessionCookie } from "@/lib/auth/session";
import { myKids } from "@/lib/mykids/client";
import { ApiError } from "@/lib/mykids/errors";
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username =
      typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const locale =
      typeof body.locale === "string" ? body.locale.slice(0, 10) : "en";
    if (!username || !password)
      return NextResponse.json(
        { error: "Enter your username and password" },
        { status: 400 },
      );
    const payload = await myKids.login(username, password, locale);
    if (!payload?.authToken)
      return NextResponse.json(
        { error: "The service returned an invalid login response" },
        { status: 502 },
      );
    const response = NextResponse.json({ ok: true });
    response.cookies.set(
      sessionCookie(encodeSession(payload, getEnv().secret)),
    );
    return response;
  } catch (error) {
    const status =
      error instanceof ApiError && error.status === 401 ? 401 : 502;
    return NextResponse.json(
      {
        error:
          status === 401
            ? "Incorrect username or password"
            : "Unable to sign in right now",
      },
      { status },
    );
  }
}

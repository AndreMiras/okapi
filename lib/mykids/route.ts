import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { selection } from "@/lib/mykids/selectors";
import { ApiError } from "./errors";
export async function context(request: Request) {
  const session = await getSession();
  if (!session)
    return {
      response: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      ),
    };
  const url = new URL(request.url);
  const picked = selection(
    session,
    url.searchParams.get("student") || undefined,
    url.searchParams.get("group") || undefined,
  );
  if (!picked.student?.studentId || !picked.course?.groupId)
    return {
      response: NextResponse.json(
        { error: "No valid student selection" },
        { status: 400 },
      ),
    };
  return { session, picked };
}
export function routeError(error: unknown) {
  const status = error instanceof ApiError && error.status === 401 ? 401 : 502;
  return NextResponse.json(
    {
      error:
        status === 401
          ? "Authentication required"
          : "The service is temporarily unavailable",
    },
    { status },
  );
}

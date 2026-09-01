import { NextResponse } from "next/server";
import { myKids } from "@/lib/mykids/client";
import { context, routeError } from "@/lib/mykids/route";
export async function GET(request: Request) {
  const result = await context(request);
  if (result.response) return result.response;
  try {
    return NextResponse.json(
      await myKids.reports(
        result.session.authToken,
        result.picked.student!.studentId!,
      ),
    );
  } catch (error) {
    return routeError(error);
  }
}

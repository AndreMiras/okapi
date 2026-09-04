import { NextResponse } from "next/server";

import { myKids } from "@/lib/mykids/client";
import { context, routeError } from "@/lib/mykids/route";

export async function GET(request: Request) {
  const result = await context(request);
  if (result.response) return result.response;
  try {
    return NextResponse.json(
      await myKids.school(
        result.session.authToken,
        result.picked.course!.schoolId!,
      ),
    );
  } catch (error) {
    return routeError(error);
  }
}

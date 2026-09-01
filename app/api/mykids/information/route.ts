import { NextResponse } from "next/server";
import { myKids } from "@/lib/mykids/client";
import { context, routeError } from "@/lib/mykids/route";
export async function GET(request: Request) {
  const result = await context(request);
  if (result.response) return result.response;
  try {
    const { course } = result.picked;
    return NextResponse.json(
      await myKids.information(
        result.session.authToken,
        course!.schoolId!,
        course!.courseId!,
        course!.groupId!,
      ),
    );
  } catch (error) {
    return routeError(error);
  }
}

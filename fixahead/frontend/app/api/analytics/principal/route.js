import { NextResponse } from "next/server";
import { getPrincipalAnalytics } from "@/lib/fixahead-api";

export async function GET(request) {
  try {
    return NextResponse.json(await getPrincipalAnalytics(request));
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Unable to load principal analytics.", code: error.code },
      { status: error.status || 500 },
    );
  }
}

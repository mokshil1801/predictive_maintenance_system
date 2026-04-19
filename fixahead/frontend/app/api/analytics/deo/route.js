import { NextResponse } from "next/server";
import { getDeoAnalytics } from "@/lib/fixahead-api";

export async function GET(request) {
  try {
    return NextResponse.json(await getDeoAnalytics(request));
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Unable to load DEO analytics.", code: error.code },
      { status: error.status || 500 },
    );
  }
}

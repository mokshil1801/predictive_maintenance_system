import { NextResponse } from "next/server";
import { getContractorAnalytics } from "@/lib/fixahead-api";

export async function GET(request) {
  try {
    return NextResponse.json(await getContractorAnalytics(request));
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Unable to load contractor analytics.", code: error.code },
      { status: error.status || 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { getPrincipalStatus } from "@/lib/fixahead-api";

export async function GET(request) {
  try {
    return NextResponse.json(await getPrincipalStatus(request));
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Unable to load principal status.", code: error.code },
      { status: error.status || 500 },
    );
  }
}

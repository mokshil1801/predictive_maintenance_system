import { NextResponse } from "next/server";
import { createReportFromRequest } from "@/lib/fixahead-api";

export async function POST(request) {
  try {
    const result = await createReportFromRequest(request);
    return NextResponse.json(
      { message: "Report submitted successfully.", ...result },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Unable to submit report.", code: error.code },
      { status: error.status || 500 },
    );
  }
}

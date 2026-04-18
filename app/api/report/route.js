import { NextResponse } from "next/server";

const { createReportFromRequest } = require("../../../lib/fixahead-api");

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const result = await createReportFromRequest(request);

    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Unable to submit report." },
      { status: error.status || 500 },
    );
  }
}

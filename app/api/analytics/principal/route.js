import { NextResponse } from "next/server";

const { getPrincipalAnalytics } = require("../../../../lib/fixahead-api");

export const runtime = "nodejs";

export async function GET(request) {
  try {
    return NextResponse.json({
      success: true,
      ...(await getPrincipalAnalytics(request)),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Unable to load principal analytics." },
      { status: error.status || 500 },
    );
  }
}

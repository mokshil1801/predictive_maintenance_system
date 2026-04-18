import { NextResponse } from "next/server";

const { getPrincipalStatus, getPrincipalAnalytics } = require("../../../lib/fixahead-api");

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const [status, analytics] = await Promise.all([
      getPrincipalStatus(request),
      getPrincipalAnalytics(request),
    ]);

    return NextResponse.json({
      success: true,
      ...status,
      analytics,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Unable to load school overview." },
      { status: error.status || 500 },
    );
  }
}

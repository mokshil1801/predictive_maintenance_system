import { NextResponse } from "next/server";

const { getDeoAnalytics } = require("../../../../lib/fixahead-api");

export const runtime = "nodejs";

export async function GET(request) {
  try {
    return NextResponse.json({
      success: true,
      ...(await getDeoAnalytics(request)),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Unable to load DEO analytics." },
      { status: error.status || 500 },
    );
  }
}

import { NextResponse } from "next/server";

const { getContractorAnalytics } = require("../../../../lib/fixahead-api");

export const runtime = "nodejs";

export async function GET(request) {
  try {
    return NextResponse.json({
      success: true,
      ...(await getContractorAnalytics(request)),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Unable to load contractor analytics." },
      { status: error.status || 500 },
    );
  }
}

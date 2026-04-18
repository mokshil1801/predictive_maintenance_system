import { NextResponse } from "next/server";

const { getPrincipalStatus } = require("../../../../lib/fixahead-api");

export const runtime = "nodejs";

export async function GET(request) {
  try {
    return NextResponse.json({
      success: true,
      ...(await getPrincipalStatus(request)),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Unable to load current status." },
      { status: error.status || 500 },
    );
  }
}

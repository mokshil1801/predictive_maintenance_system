import { NextResponse } from "next/server";

const { assignPrediction } = require("../../../lib/fixahead-api");

export const runtime = "nodejs";

export async function POST(request) {
  try {
    return NextResponse.json({
      success: true,
      ...(await assignPrediction(request)),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Unable to assign contractor." },
      { status: error.status || 500 },
    );
  }
}

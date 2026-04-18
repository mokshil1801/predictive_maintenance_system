import { NextResponse } from "next/server";

const { completeWorkOrder } = require("../../../lib/fixahead-api");

export const runtime = "nodejs";

export async function POST(request) {
  try {
    return NextResponse.json({
      success: true,
      ...(await completeWorkOrder(request)),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Unable to complete work order." },
      { status: error.status || 500 },
    );
  }
}

import { NextResponse } from "next/server";

const { getPriorityQueue } = require("../../../../lib/fixahead-api");

export const runtime = "nodejs";

export async function GET(request) {
  try {
    return NextResponse.json({
      success: true,
      queue: await getPriorityQueue(request),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Unable to load priority queue." },
      { status: error.status || 500 },
    );
  }
}

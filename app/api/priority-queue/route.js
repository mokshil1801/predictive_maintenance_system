import { NextResponse } from "next/server";

const { getPriorityQueue, getDeoAnalytics } = require("../../../lib/fixahead-api");

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const [queue, analytics] = await Promise.all([
      getPriorityQueue(request),
      getDeoAnalytics(request),
    ]);

    return NextResponse.json({
      success: true,
      queue,
      analytics,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Unable to load priority queue." },
      { status: error.status || 500 },
    );
  }
}

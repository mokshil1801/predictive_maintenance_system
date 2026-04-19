import { NextResponse } from "next/server";
import { getPriorityQueue } from "@/lib/fixahead-api";

export async function GET(request) {
  try {
    return NextResponse.json({ items: await getPriorityQueue(request) });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Unable to load priority queue.", code: error.code },
      { status: error.status || 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { assignPrediction } from "@/lib/fixahead-api";

export async function POST(request) {
  try {
    return NextResponse.json({ task: await assignPrediction(request) }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Unable to assign contractor.", code: error.code },
      { status: error.status || 500 },
    );
  }
}

import { NextResponse } from "next/server";

const { getContractorTasks } = require("../../../../lib/fixahead-api");

export const runtime = "nodejs";

export async function GET(request) {
  try {
    return NextResponse.json({
      success: true,
      tasks: await getContractorTasks(request),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Unable to load contractor tasks." },
      { status: error.status || 500 },
    );
  }
}

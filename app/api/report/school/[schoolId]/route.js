import { NextResponse } from "next/server";

const { getReportsForSchool } = require("../../../../../lib/fixahead-api");

export const runtime = "nodejs";

export async function GET(request, { params }) {
  const { schoolId } = await params;

  try {
    return NextResponse.json({
      success: true,
      reports: await getReportsForSchool(request, schoolId),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Unable to load school reports." },
      { status: error.status || 500 },
    );
  }
}

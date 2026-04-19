import { NextResponse } from "next/server";
import { getReportsForSchool } from "@/lib/fixahead-api";

export async function GET(request, { params }) {
  try {
    const { schoolId } = await params;
    return NextResponse.json({ reports: await getReportsForSchool(request, schoolId) });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Unable to load school reports.", code: error.code },
      { status: error.status || 500 },
    );
  }
}

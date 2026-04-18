import { NextResponse } from "next/server";

const { getSchools } = require("../../../lib/fixahead-api");

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      schools: await getSchools(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Unable to load schools." },
      { status: error.status || 500 },
    );
  }
}

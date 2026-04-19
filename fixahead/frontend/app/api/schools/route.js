import { NextResponse } from "next/server";
import { getSchools } from "@/lib/fixahead-api";

export async function GET() {
  try {
    return NextResponse.json({ schools: await getSchools() });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Unable to load schools." },
      { status: error.status || 500 },
    );
  }
}

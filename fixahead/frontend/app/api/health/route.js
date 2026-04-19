import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "fixahead-web",
    timestamp: new Date().toISOString(),
  });
}

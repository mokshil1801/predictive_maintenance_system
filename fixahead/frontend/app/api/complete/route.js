import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { message: "Use PATCH /api/contractor/task/:id/complete for live task completion." },
    { status: 405 },
  );
}

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    message: "Password reset is handled by the Express auth service.",
  });
}

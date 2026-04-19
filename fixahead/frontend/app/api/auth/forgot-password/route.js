import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    message: "If the email exists, a password reset link has been sent.",
  });
}

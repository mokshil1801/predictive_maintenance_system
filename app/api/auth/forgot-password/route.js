import { NextResponse } from "next/server";

const { forgotPassword } = require("../../../../lib/auth-server");

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const payload = await request.json();
    const result = await forgotPassword(payload);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Password reset request failed." },
      { status: error.status || 500 },
    );
  }
}

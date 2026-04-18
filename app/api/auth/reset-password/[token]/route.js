import { NextResponse } from "next/server";

const { resetPassword } = require("../../../../../lib/auth-server");

export const runtime = "nodejs";

export async function POST(request, { params }) {
  try {
    const { token } = await params;
    const payload = await request.json();
    const result = await resetPassword({ ...payload, token });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Password reset failed." },
      { status: error.status || 500 },
    );
  }
}

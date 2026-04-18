import { NextResponse } from "next/server";

const { loginUser } = require("../../../../lib/auth-server");

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const payload = await request.json();
    const result = await loginUser(payload);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Login failed." },
      { status: error.status || 500 },
    );
  }
}

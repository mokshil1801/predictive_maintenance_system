import { NextResponse } from "next/server";

const { registerUser } = require("../../../../lib/auth-server");

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const payload = await request.json();
    const result = await registerUser(payload);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Registration failed." },
      { status: error.status || 500 },
    );
  }
}

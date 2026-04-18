import { NextResponse } from "next/server";

const { sendTestEmail } = require("../../../../lib/auth-server");

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const payload = await request.json();
    const result = await sendTestEmail(payload);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Test email failed." },
      { status: error.status || 500 },
    );
  }
}

import { NextResponse } from "next/server";

const { verifyEmailToken } = require("../../../../../lib/auth-server");

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  const { token } = await params;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  try {
    const verified = await verifyEmailToken(token);
    const status = verified ? "1" : "invalid";

    return NextResponse.redirect(`${frontendUrl}/login?verified=${status}`);
  } catch (_error) {
    return NextResponse.redirect(`${frontendUrl}/login?verified=invalid`);
  }
}

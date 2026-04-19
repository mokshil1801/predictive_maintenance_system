import { NextResponse } from "next/server";
import { registerAuthUser } from "@/lib/auth-server";

export async function POST(request) {
  try {
    return NextResponse.json(await registerAuthUser(await request.json()), { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Registration failed." },
      { status: error.status || 500 },
    );
  }
}

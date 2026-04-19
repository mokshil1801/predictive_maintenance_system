import { NextResponse } from "next/server";
import { loginAuthUser } from "@/lib/auth-server";

export async function POST(request) {
  try {
    return NextResponse.json(await loginAuthUser(await request.json()));
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Login failed." },
      { status: error.status || 500 },
    );
  }
}

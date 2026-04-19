import { NextResponse } from "next/server";
import { getContractorTasks } from "@/lib/fixahead-api";

export async function GET(request) {
  try {
    return NextResponse.json({ tasks: await getContractorTasks(request) });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Unable to load contractor tasks.", code: error.code },
      { status: error.status || 500 },
    );
  }
}

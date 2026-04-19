import { NextResponse } from "next/server";
import { completeWorkOrder } from "@/lib/fixahead-api";

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    return NextResponse.json({ task: await completeWorkOrder(request, id) });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Unable to complete contractor task.", code: error.code },
      { status: error.status || 500 },
    );
  }
}

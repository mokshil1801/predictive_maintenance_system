import { NextResponse } from "next/server";

const { completeWorkOrder } = require("../../../../../../lib/fixahead-api");

export const runtime = "nodejs";

export async function PATCH(request, { params }) {
  const { id } = await params;

  try {
    return NextResponse.json({
      success: true,
      ...(await completeWorkOrder(request, id)),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Unable to complete task." },
      { status: error.status || 500 },
    );
  }
}

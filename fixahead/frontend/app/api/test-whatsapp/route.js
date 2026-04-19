import { NextResponse } from "next/server";
import { sendWhatsAppAlert } from "@/services/whatsapp.service";

export async function POST(request) {
  try {
    const body = await request.json();
    const phone = body.phone;
    const message =
      body.message ||
      [
        "🚨 *Critical Infrastructure Alert*",
        "",
        "School: Govt School Ahmedabad",
        "Issue: Plumbing Failure Risk",
        "Risk Score: 92",
        "Students Affected: 120",
        "Failure Expected In: 15 Days",
        "",
        "⚠ Immediate Action Required",
      ].join("\n");

    const response = await sendWhatsAppAlert(phone, message);

    return NextResponse.json({
      success: true,
      message: "WhatsApp test alert sent successfully.",
      sid: response.sid,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Unable to send WhatsApp test alert.",
      },
      { status: 500 },
    );
  }
}

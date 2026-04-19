const twilio = require("twilio");

function maskPhone(phone) {
  const value = String(phone || "");
  if (value.length <= 4) {
    return "****";
  }
  return `${"*".repeat(Math.max(0, value.length - 4))}${value.slice(-4)}`;
}

function normalizeWhatsAppNumber(phone) {
  const value = String(phone || "").trim();

  if (!value) {
    throw new Error("Recipient phone number is required.");
  }

  if (value.startsWith("whatsapp:+")) {
    return value;
  }

  if (value.startsWith("+")) {
    return `whatsapp:${value}`;
  }

  throw new Error("Phone number must be in E.164 format, for example +919876543210.");
}

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error("Twilio WhatsApp credentials are not configured.");
  }

  return twilio(accountSid, authToken);
}

async function sendWhatsAppAlert(phone, message) {
  const from =
    process.env.TWILIO_WHATSAPP_NUMBER ||
    process.env.TWILIO_PHONE ||
    "whatsapp:+14155238886";
  const to = normalizeWhatsAppNumber(phone);
  const client = getTwilioClient();

  try {
    const response = await client.messages.create({
      from: from.startsWith("whatsapp:") ? from : `whatsapp:${from}`,
      to,
      body: message,
    });

    console.log(`[whatsapp] Alert sent to ${maskPhone(phone)} (${response.sid})`);
    return response;
  } catch (error) {
    console.error(`[whatsapp] Failed to send alert to ${maskPhone(phone)}: ${error.message}`);
    throw error;
  }
}

module.exports = {
  maskPhone,
  normalizeWhatsAppNumber,
  sendWhatsAppAlert,
};

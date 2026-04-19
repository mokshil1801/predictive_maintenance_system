let ioInstance = null;

function setSocketServer(io) {
  ioInstance = io;
}

function normalizeRooms(rooms = []) {
  return Array.from(new Set(rooms.filter(Boolean).map(String)));
}

async function emitViaHttp(eventName, payload, rooms) {
  const endpoint = process.env.REALTIME_EMIT_URL;
  const secret = process.env.REALTIME_INTERNAL_SECRET;

  if (!endpoint || !secret || typeof fetch !== "function") {
    return;
  }

  try {
    await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": secret,
      },
      body: JSON.stringify({ eventName, payload, rooms }),
    });
  } catch (error) {
    console.error(`[realtime] Failed to relay ${eventName}:`, error.message);
  }
}

async function emitToRooms(eventName, payload = {}, rooms = []) {
  const targetRooms = normalizeRooms(rooms);

  if (ioInstance) {
    if (targetRooms.length === 0) {
      ioInstance.emit(eventName, payload);
      return;
    }

    targetRooms.forEach((room) => {
      ioInstance.to(room).emit(eventName, payload);
    });
    return;
  }

  await emitViaHttp(eventName, payload, targetRooms);
}

async function emitWorkflowEvent(eventName, payload = {}, rooms = []) {
  await emitToRooms(eventName, payload, rooms);
}

function workflowRooms({ schoolId, contractorId } = {}) {
  const rooms = ["deo_room"];

  if (schoolId) {
    rooms.push(`principal_${schoolId}`);
  }

  if (contractorId) {
    rooms.push(`contractor_${contractorId}`);
  }

  return rooms;
}

module.exports = {
  emitToRooms,
  emitWorkflowEvent,
  setSocketServer,
  workflowRooms,
};

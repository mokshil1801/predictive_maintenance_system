let ioInstance = null;

function setSocketServer(io) {
  ioInstance = io;
}

function emitToRooms(eventName, payload, rooms = []) {
  const uniqueRooms = Array.from(new Set(rooms.filter(Boolean)));

  if (ioInstance) {
    if (uniqueRooms.length === 0) {
      ioInstance.emit(eventName, payload);
    } else {
      uniqueRooms.forEach((room) => ioInstance.to(room).emit(eventName, payload));
    }
  }
}

async function emitWorkflowEvent(eventName, payload, rooms = []) {
  emitToRooms(eventName, payload, rooms);

  const emitUrl = process.env.REALTIME_EMIT_URL;
  if (!ioInstance && emitUrl) {
    try {
      await fetch(emitUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-realtime-secret": process.env.REALTIME_INTERNAL_SECRET || "fixahead-dev-realtime",
        },
        body: JSON.stringify({ eventName, payload, rooms }),
      });
    } catch (_error) {
      // Realtime delivery must never roll back already-saved database writes.
    }
  }
}

function workflowRooms({ schoolId, contractorId } = {}) {
  return [
    "deo_room",
    schoolId ? `principal_${schoolId}` : null,
    contractorId ? `contractor_${contractorId}` : null,
  ].filter(Boolean);
}

module.exports = {
  emitToRooms,
  emitWorkflowEvent,
  setSocketServer,
  workflowRooms,
};

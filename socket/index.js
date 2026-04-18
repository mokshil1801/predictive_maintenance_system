const jwt = require("jsonwebtoken");
const { User } = require("../models");
const { getJwtSecret } = require("../middleware/auth.middleware");
const { setSocketServer } = require("../services/realtime.service");

async function attachSocketServer(io) {
  setSocketServer(io);

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next();
      }

      const decoded = jwt.verify(token, getJwtSecret());
      const user = await User.findById(decoded.userId).lean();
      socket.user = user || null;
      return next();
    } catch (_error) {
      return next();
    }
  });

  io.on("connection", (socket) => {
    const user = socket.user;

    if (user?.role === "deo") {
      socket.join("deo_room");
    }

    if (user?.role === "principal" && user.assignedSchoolId) {
      socket.join(`principal_${user.assignedSchoolId.toString()}`);
    }

    if (user?.role === "contractor") {
      socket.join(`contractor_${user._id.toString()}`);
    }

    socket.on("join:room", (room) => {
      if (typeof room === "string" && room.length < 120) {
        socket.join(room);
      }
    });
  });
}

module.exports = {
  attachSocketServer,
};

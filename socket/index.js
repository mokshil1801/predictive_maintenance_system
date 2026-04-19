const jwt = require("jsonwebtoken");
const { School, User } = require("../models");
const { getJwtSecret } = require("../middleware/auth.middleware");
const { setSocketServer } = require("../services/realtime.service");

async function authenticateSocket(socket, next) {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Socket authentication token is required."));
    }

    const decoded = jwt.verify(token, getJwtSecret());
    const user = await User.findById(decoded.userId).select(
      "_id role assignedSchoolId district name email",
    );

    if (!user) {
      return next(new Error("Socket authentication failed."));
    }

    socket.user = user;
    return next();
  } catch (error) {
    return next(new Error("Socket authentication failed."));
  }
}

function attachSocketServer(io) {
  setSocketServer(io);
  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    const user = socket.user;

    if (user.role === "deo") {
      socket.join("deo_room");
    }

    if (user.role === "principal") {
      void (async () => {
        let schoolId = user.assignedSchoolId;

        if (!schoolId) {
          const school =
            (await School.findOne({ principalId: user._id })) ||
            (await School.findOne({
              $or: [{ principalId: null }, { principalId: { $exists: false } }],
            }).sort({ createdAt: 1, name: 1 }));

          if (school) {
            school.principalId = user._id;
            await school.save();
            user.assignedSchoolId = school._id;
            user.district = user.district || school.district;
            await user.save();
            schoolId = school._id;
          }
        }

        if (schoolId) {
          socket.join(`principal_${schoolId.toString()}`);
        }
      })();
    }

    if (user.role === "contractor") {
      socket.join(`contractor_${user._id.toString()}`);
    }

    socket.emit("socket:ready", {
      userId: user._id.toString(),
      role: user.role,
    });
  });
}

module.exports = {
  attachSocketServer,
};

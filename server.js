require("dotenv").config({ path: ".env.local" });
require("dotenv").config();

const cors = require("cors");
const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const authRoutes = require("./routes/auth.routes");
const reportRoutes = require("./routes/report.routes");
const workflowRoutes = require("./routes/workflow.routes");
const { connectToDatabase } = require("./lib/mongodb");
const { attachSocketServer } = require("./socket");
const { emitToRooms } = require("./services/realtime.service");

const app = express();
const server = http.createServer(app);
const port = Number(process.env.PORT || 5000);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  },
});

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "public", "uploads")));

app.post("/internal/emit", (req, res) => {
  const secret = req.get("x-realtime-secret");
  if (secret !== (process.env.REALTIME_INTERNAL_SECRET || "fixahead-dev-realtime")) {
    return res.status(401).json({ success: false, message: "Unauthorized realtime emit." });
  }

  const { eventName, payload, rooms } = req.body || {};
  if (!eventName) {
    return res.status(400).json({ success: false, message: "eventName is required." });
  }

  emitToRooms(eventName, payload || {}, Array.isArray(rooms) ? rooms : []);
  return res.status(200).json({ success: true });
});

app.use(authRoutes);
app.use(reportRoutes);
app.use(workflowRoutes);

app.use((error, _req, res, _next) => {
  return res.status(error.status || error.statusCode || 500).json({
    success: false,
    message: error.message || "Unexpected server error.",
  });
});

async function startServer() {
  await connectToDatabase();
  await attachSocketServer(io);

  server.listen(port, () => {
    console.log(`[server] FixAhead API and Socket.IO running on http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error(`[server] Startup failed: ${error.message}`);
  process.exit(1);
});

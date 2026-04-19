require("dotenv").config({ path: ".env.local" });
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const authRoutes = require("./routes/auth.routes");
const reportRoutes = require("./routes/report.routes");
const workflowRoutes = require("./routes/workflow.routes");
const whatsappRoutes = require("./routes/whatsapp.routes");
const { connectToDatabase } = require("./lib/mongodb");
const { attachSocketServer } = require("./socket");

const app = express();
const server = http.createServer(app);
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

app.use(cors({ origin: frontendUrl, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "public", "uploads")));

app.post("/internal/emit", (req, res) => {
  if (req.headers["x-internal-secret"] !== process.env.REALTIME_INTERNAL_SECRET) {
    return res.status(401).json({ message: "Invalid realtime relay secret." });
  }

  const { eventName, payload, rooms = [] } = req.body || {};
  if (!eventName) {
    return res.status(400).json({ message: "eventName is required." });
  }

  if (Array.isArray(rooms) && rooms.length > 0) {
    rooms.forEach((room) => io.to(room).emit(eventName, payload || {}));
  } else {
    io.emit(eventName, payload || {});
  }

  return res.json({ success: true });
});

app.use(authRoutes);
app.use(reportRoutes);
app.use(workflowRoutes);
app.use(whatsappRoutes);

app.use((error, _req, res, _next) => {
  console.error("[api]", error);
  return res.status(error.status || error.statusCode || 500).json({
    message: error.message || "Unexpected API error.",
    code: error.code || "API_ERROR",
  });
});

const io = new Server(server, {
  cors: {
    origin: frontendUrl,
    credentials: true,
  },
});

attachSocketServer(io);

const port = Number(process.env.PORT || 5000);

connectToDatabase()
  .then(() => {
    server.listen(port, () => {
      console.log(`FixAhead API and realtime server running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start FixAhead API server:", error);
    process.exit(1);
  });

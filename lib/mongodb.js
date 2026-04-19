const mongoose = require("mongoose");

let cached = global.__fixaheadMongo;

if (!cached) {
  cached = global.__fixaheadMongo = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  const uri = process.env.MONGO_URL || process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGO_URL is required to connect FixAhead to MongoDB.");
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      dbName: process.env.MONGO_DB_NAME || undefined,
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = {
  connectToDatabase,
};

const mongoose = require("mongoose");

const cached = global.__fixaheadMongoose || {
  conn: null,
  promise: null,
};

global.__fixaheadMongoose = cached;

async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  const mongoUrl = process.env.MONGO_URL;

  if (!mongoUrl) {
    throw new Error("MONGO_URL is not configured.");
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(mongoUrl, {
      dbName: process.env.MONGO_DB_NAME || "fixahead",
      autoIndex: true,
      serverSelectionTimeoutMS: 10000,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = {
  connectToDatabase,
};

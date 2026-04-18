const mongoose = require("mongoose");

const cached = global.__fixaheadMongoose || {
  conn: null,
  promise: null,
  indexesReady: false,
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
  await ensureIndexes();
  return cached.conn;
}

async function ensureIndexes() {
  if (cached.indexesReady) {
    return;
  }

  const db = mongoose.connection.db;
  const collections = await db.listCollections({ name: "users" }).toArray();

  if (collections.length) {
    const usersCollection = db.collection("users");
    const indexes = await usersCollection.indexes();
    const phoneIndex = indexes.find((index) => index.name === "phone_1");

    if (
      phoneIndex &&
      (!phoneIndex.partialFilterExpression ||
        phoneIndex.partialFilterExpression.phone?.$type !== "string")
    ) {
      await usersCollection.dropIndex("phone_1");
    }

    await usersCollection.createIndex(
      { phone: 1 },
      {
        name: "phone_1",
        unique: true,
        partialFilterExpression: {
          phone: { $type: "string" },
        },
      },
    );
  }

  cached.indexesReady = true;
}

module.exports = {
  connectToDatabase,
};

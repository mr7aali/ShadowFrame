import mongoose from "mongoose";

const DEFAULT_URI = "mongodb://127.0.0.1:27017/crime-studio";

type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };

// Reuse one connection across hot reloads in dev.
const globalForMongoose = globalThis as unknown as { __mongoose?: Cache };
const cache: Cache = (globalForMongoose.__mongoose ??= { conn: null, promise: null });

export async function connectDB(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;
  if (!cache.promise) {
    const uri = process.env.MONGODB_URI || DEFAULT_URI;
    cache.promise = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 5000 })
      .catch((err) => {
        cache.promise = null;
        throw new Error(
          `Could not connect to MongoDB at ${uri.replace(/\/\/[^@]*@/, "//***@")}. ` +
            `Start MongoDB or set MONGODB_URI in studio/.env.local. (${err.message})`,
        );
      });
  }
  cache.conn = await cache.promise;
  return cache.conn;
}

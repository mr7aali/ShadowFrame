/**
 * Local MongoDB for development without installing MongoDB.
 * Data persists in studio/.mongo-data. Leave this running in its own terminal.
 *
 *   npm run db
 *
 * If you already run MongoDB (local install or Atlas), skip this and set
 * MONGODB_URI in .env.local instead.
 */
import fs from "node:fs";
import path from "node:path";
import { MongoMemoryServer } from "mongodb-memory-server";

async function main() {
  const dbPath = path.join(process.cwd(), ".mongo-data");
  fs.mkdirSync(dbPath, { recursive: true });
  const port = Number(process.env.MONGO_PORT ?? 27017);

  const server = await MongoMemoryServer.create({
    instance: { port, dbPath, storageEngine: "wiredTiger" },
  });
  console.log(`MongoDB running at ${server.getUri()} (data in .mongo-data). Ctrl+C to stop.`);

  const stop = async () => {
    await server.stop({ doCleanup: false });
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

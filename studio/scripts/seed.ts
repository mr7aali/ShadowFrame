/**
 * Import every video_N/ folder in the repo into MongoDB.
 * Safe to re-run: content is refreshed, work state (statuses, images, notes) is kept.
 *
 *   npm run seed
 */
import mongoose from "mongoose";
import { importEpisodeFolder, listEpisodeFolders } from "../src/lib/importer";

async function main() {
  const folders = await listEpisodeFolders();
  if (!folders.length) console.log("No video_N folders found.");
  for (const folder of folders) {
    const r = await importEpisodeFolder(folder);
    console.log(
      `${r.code} (${r.folder}): ${r.steps} steps, ${r.shots} shots, ` +
        `${r.characters} characters, ${r.locations} locations`,
    );
  }
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err instanceof Error ? err.message : err);
  await mongoose.disconnect();
  process.exit(1);
});

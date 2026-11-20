import mongoose from "mongoose";
import { AiSettings, Asset, Character, Episode, LibraryItem } from "../src/lib/models";
async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/crime-studio");
  const mara = await Character.findOne({ episode: "EP001", slug: "mara" }).lean();
  console.log(JSON.stringify({ mara: mara && { status: mara.status, image: mara.image }, episodes: (await Episode.find({}, { code: 1 }).lean()).map(e => e.code), lib: await LibraryItem.countDocuments(), assets: await Asset.countDocuments(), ai: await AiSettings.countDocuments() }));
  await mongoose.disconnect();
}
main();

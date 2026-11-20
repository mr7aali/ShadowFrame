import "server-only";
import { connection } from "next/server";
import { connectDB } from "./db";
import { providerInfo } from "./ai/catalog";
import { getAiPublic } from "./ai/settings";
import type { AssetView, LibraryItemView, LibraryType } from "./library";
import { Asset, Episode, LibraryItem } from "./models";

function plain<T>(doc: unknown): T {
  return JSON.parse(JSON.stringify(doc)) as T;
}

async function ready() {
  await connection();
  await connectDB();
}

export async function getLibrary(type?: LibraryType): Promise<LibraryItemView[]> {
  await ready();
  return plain(await LibraryItem.find(type ? { type } : {}).sort({ name: 1 }).lean());
}

export async function getLibraryItem(id: string): Promise<LibraryItemView | null> {
  await ready();
  if (!/^[a-f0-9]{24}$/.test(id)) return null;
  const doc = await LibraryItem.findById(id).lean();
  return doc ? plain(doc) : null;
}

/** Items by id, in the given order (missing ids skipped). Works outside a request too. */
export async function getLibraryItems(ids: string[]): Promise<LibraryItemView[]> {
  const valid = ids.filter((id) => /^[a-f0-9]{24}$/.test(id));
  if (!valid.length) return [];
  await connectDB();
  const docs = plain<LibraryItemView[]>(await LibraryItem.find({ _id: { $in: valid } }).lean());
  return valid.map((id) => docs.find((d) => d._id === id)).filter((d): d is LibraryItemView => !!d);
}

export async function getAssets(filter: { episode?: string; item?: string }, limit = 200): Promise<AssetView[]> {
  await ready();
  const q: Record<string, string> = {};
  if (filter.episode !== undefined) q.episode = filter.episode;
  if (filter.item !== undefined) q.item = filter.item;
  return plain(await Asset.find(q).sort({ createdAt: -1 }).limit(limit).lean());
}

export async function getEpisodesUsing(id: string): Promise<{ code: string; title: string }[]> {
  await ready();
  return plain(
    await Episode.find(
      { $or: [{ libraryStory: id }, { libraryCast: id }, { libraryLocations: id }] },
      { code: 1, title: 1 },
    )
      .sort({ code: 1 })
      .lean(),
  );
}

/** Names of the AIs routed to text and images, for buttons. */
export async function getAiNames(): Promise<{ text: string | null; image: string | null }> {
  const ai = await getAiPublic();
  const name = (id: string) => (id ? (providerInfo(id)?.name ?? id) : null);
  return { text: name(ai.routing.text.provider), image: name(ai.routing.image.provider) };
}

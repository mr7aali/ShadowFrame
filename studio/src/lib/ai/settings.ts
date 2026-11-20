import "server-only";
import { connection } from "next/server";
import { connectDB } from "../db";
import { AiSettings } from "../models";
import {
  CAPABILITIES,
  PROVIDERS,
  providerInfo,
  type AiPublic,
  type Capability,
  type ProviderId,
  type RouteConfig,
} from "./catalog";

/**
 * API keys live in MongoDB (saved from the AI connections page) or in
 * studio/.env.local. A saved key wins over the env var. Keys stay on the
 * server: the browser only ever sees a masked hint.
 */

type Stored = {
  providers: Map<string, { apiKey?: string; baseUrl?: string }> | Record<string, { apiKey?: string; baseUrl?: string }>;
  routing?: Partial<Record<Capability, Partial<RouteConfig>>>;
};

async function load(): Promise<Stored> {
  await connectDB();
  const doc = await AiSettings.findById("ai").lean();
  return (doc as unknown as Stored) ?? { providers: {}, routing: {} };
}

function stored(s: Stored, id: string) {
  const p = s.providers instanceof Map ? s.providers.get(id) : s.providers?.[id];
  return p ?? {};
}

export type ResolvedProvider = { id: ProviderId; apiKey: string; baseUrl: string };

function resolve(s: Stored, id: ProviderId): ResolvedProvider | null {
  const info = providerInfo(id);
  if (!info) return null;
  const saved = stored(s, id);
  const apiKey = saved.apiKey || process.env[info.envVar] || "";
  const baseUrl = (saved.baseUrl || info.baseUrl || "").replace(/\/+$/, "");
  if (!apiKey && !info.keyless) return null;
  // Ollama counts as connected only once you have saved it (no key to detect).
  if (info.keyless && !saved.baseUrl && !apiKey) return null;
  return { id, apiKey, baseUrl };
}

function mask(key: string) {
  if (!key) return "";
  return key.length <= 8 ? "••••" : `${key.slice(0, 4)}…${key.slice(-4)}`;
}

/** Default route: the first connected provider that supports the capability. */
function route(s: Stored, cap: Capability): RouteConfig {
  const r = s.routing?.[cap] ?? {};
  // "none" = the creator chose copy & paste for this task on purpose.
  if ((r.provider as string) === "none") return { provider: "", model: "", voice: "" };
  let provider = (r.provider ?? "") as ProviderId | "";
  if (provider && (!resolve(s, provider) || !providerInfo(provider)?.models[cap])) provider = "";
  if (!provider) {
    const first = PROVIDERS.find((p) => p.models[cap] && resolve(s, p.id));
    provider = first?.id ?? "";
  }
  const info = provider ? providerInfo(provider) : undefined;
  const sameProvider = provider === r.provider;
  return {
    provider,
    model: (sameProvider && r.model) || info?.models[cap]?.default || "",
    voice: (sameProvider && r.voice) || info?.voice?.default || "",
  };
}

export async function getAiPublic(): Promise<AiPublic> {
  await connection(); // settings are per-request, never part of a static shell
  const s = await load();
  return {
    providers: PROVIDERS.map((p) => {
      const saved = stored(s, p.id);
      const r = resolve(s, p.id);
      return {
        id: p.id,
        connected: !!r,
        source: saved.apiKey || (p.keyless && saved.baseUrl) ? "saved" : r ? "env" : "none",
        keyHint: mask(r?.apiKey ?? ""),
        baseUrl: saved.baseUrl || p.baseUrl || "",
      };
    }),
    routing: Object.fromEntries(CAPABILITIES.map((c) => [c.key, route(s, c.key)])) as Record<
      Capability,
      RouteConfig
    >,
  };
}

/** The provider + model + key to use for a task, or null when nothing is connected. */
export async function getRoute(cap: Capability): Promise<(RouteConfig & { creds: ResolvedProvider }) | null> {
  const s = await load();
  const r = route(s, cap);
  if (!r.provider) return null;
  const creds = resolve(s, r.provider);
  return creds ? { ...r, creds } : null;
}

export async function getProviderCreds(id: ProviderId): Promise<ResolvedProvider | null> {
  return resolve(await load(), id);
}

export async function saveProviderConfig(id: ProviderId, apiKey: string | null, baseUrl: string) {
  await connectDB();
  const set: Record<string, string> = { [`providers.${id}.baseUrl`]: baseUrl };
  if (apiKey !== null) set[`providers.${id}.apiKey`] = apiKey;
  await AiSettings.updateOne({ _id: "ai" }, { $set: set }, { upsert: true });
}

export async function removeProviderConfig(id: ProviderId) {
  await connectDB();
  await AiSettings.updateOne({ _id: "ai" }, { $unset: { [`providers.${id}`]: "" } }, { upsert: true });
}

export async function saveRouteConfig(cap: Capability, r: RouteConfig) {
  await connectDB();
  await AiSettings.updateOne(
    { _id: "ai" },
    { $set: { [`routing.${cap}`]: { ...r, provider: r.provider || "none" } } },
    { upsert: true },
  );
}

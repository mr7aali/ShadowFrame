"use client";

import { useState, useTransition } from "react";
import { BTN, BTN_PRIMARY, Card, INPUT } from "@/components/ui";
import {
  PROVIDERS,
  providerInfo,
  type Capability,
  type ProviderId,
  type ProviderInfo,
  type ProviderPublic,
  type RouteConfig,
} from "@/lib/ai/catalog";
import { removeProvider, saveProvider, saveRouting, testProvider } from "@/lib/studio-actions";

const CAP_LABEL: Record<Capability, string> = { text: "Text", image: "Images", voice: "Voice" };

export function ProviderCard({ info, state }: { info: ProviderInfo; state: ProviderPublic }) {
  const [editing, setEditing] = useState(!state.connected);
  const [key, setKey] = useState("");
  const [baseUrl, setBaseUrl] = useState(state.baseUrl);
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const caps = (Object.keys(info.models) as Capability[]).map((c) => CAP_LABEL[c]);

  function onSave() {
    setResult(null);
    start(async () => {
      try {
        // Keep the existing key when only the base URL changed.
        await saveProvider(info.id, key || (state.connected && !info.keyless ? null : key), baseUrl);
        setKey("");
        setEditing(false);
        const r = await testProvider(info.id);
        setResult(r);
      } catch (e) {
        setResult({ ok: false, message: e instanceof Error ? e.message : "Save failed" });
      }
    });
  }

  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{info.name}</h3>
            {state.connected ? (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                Connected{state.source === "env" ? " · .env" : ""}
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 ring-1 ring-slate-200">
                Not connected
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-muted">{info.blurb}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {caps.map((c) => (
          <span key={c} className="rounded-md bg-accent-soft px-1.5 py-0.5 text-[11px] font-medium text-accent">
            {c}
          </span>
        ))}
      </div>

      {state.connected && !editing ? (
        <div className="mt-4 flex flex-1 flex-col justify-end gap-3">
          {state.keyHint && <div className="font-mono text-xs text-muted">Key {state.keyHint}</div>}
          {info.baseUrl && <div className="truncate font-mono text-xs text-muted">{state.baseUrl}</div>}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              className={BTN}
              onClick={() => start(async () => setResult(await testProvider(info.id)))}
            >
              {pending ? "Testing…" : "Test"}
            </button>
            <button type="button" className={BTN} onClick={() => setEditing(true)}>
              {state.source === "env" ? "Override" : "Edit"}
            </button>
            {state.source === "saved" && (
              <button
                type="button"
                disabled={pending}
                className={`${BTN} text-rose-600!`}
                onClick={() => confirm(`Remove ${info.name}?`) && start(() => removeProvider(info.id))}
              >
                Remove
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {!info.keyless && (
            <label className="block text-sm">
              <span className="mb-1 flex items-center justify-between text-xs font-medium text-muted">
                API key
                <a href={info.keyUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                  Get a key ↗
                </a>
              </span>
              <input
                type="password"
                autoComplete="off"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder={state.connected ? "Leave empty to keep the current key" : "Paste your key"}
                className={`${INPUT} font-mono`}
              />
            </label>
          )}
          {info.baseUrl && (
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-medium text-muted">Base URL</span>
              <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} className={`${INPUT} font-mono text-xs`} />
            </label>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending || (!key && !state.connected && !info.keyless)}
              onClick={onSave}
              className={BTN_PRIMARY}
            >
              {pending ? "Saving…" : info.keyless ? "Connect" : "Save & test"}
            </button>
            {state.connected && (
              <button type="button" className={BTN} onClick={() => setEditing(false)}>
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {result && (
        <p
          className={`mt-3 rounded-lg px-3 py-2 text-xs ${
            result.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
          }`}
        >
          {result.message}
        </p>
      )}
    </Card>
  );
}

export function RoutingRow({
  capability,
  route,
  connected,
}: {
  capability: { key: Capability; label: string; description: string };
  route: RouteConfig;
  connected: ProviderId[];
}) {
  const [provider, setProvider] = useState<ProviderId | "">(route.provider);
  const [model, setModel] = useState(route.model);
  const [voice, setVoice] = useState(route.voice);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  const options = PROVIDERS.filter((p) => p.models[capability.key]);
  const info = provider ? providerInfo(provider) : undefined;
  const modelInfo = info?.models[capability.key];
  const dirty = provider !== route.provider || model !== route.model || voice !== route.voice;
  const listId = `models-${capability.key}`;
  const voiceListId = `voices-${capability.key}`;

  return (
    <div className="grid gap-3 px-5 py-4 sm:grid-cols-[220px_1fr]">
      <div>
        <div className="font-medium">{capability.label}</div>
        <div className="text-xs text-muted">{capability.description}</div>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-xs text-muted">
          Provider
          <select
            value={provider}
            onChange={(e) => {
              const id = e.target.value as ProviderId | "";
              setProvider(id);
              const p = id ? providerInfo(id) : undefined;
              setModel(p?.models[capability.key]?.default ?? "");
              setVoice(p?.voice?.default ?? "");
            }}
            className={`${INPUT} mt-1 w-48!`}
          >
            <option value="">Copy & paste (no API)</option>
            {options.map((p) => (
              <option key={p.id} value={p.id} disabled={!connected.includes(p.id)}>
                {p.name}
                {connected.includes(p.id) ? "" : " — not connected"}
              </option>
            ))}
          </select>
        </label>
        {provider && (
          <label className="text-xs text-muted">
            Model
            <input
              list={listId}
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className={`${INPUT} mt-1 w-56! font-mono text-xs`}
            />
            <datalist id={listId}>
              {modelInfo?.suggestions.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </label>
        )}
        {provider && info?.voice && capability.key === "voice" && (
          <label className="text-xs text-muted">
            {info.voice.label}
            <input
              list={voiceListId}
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              placeholder={info.id === "elevenlabs" ? "Paste a voice ID" : ""}
              className={`${INPUT} mt-1 w-44! font-mono text-xs`}
            />
            <datalist id={voiceListId}>
              {info.voice.suggestions.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </label>
        )}
        <button
          type="button"
          disabled={!dirty || pending}
          onClick={() =>
            start(async () => {
              await saveRouting(capability.key, { provider, model, voice });
              setSaved(true);
              setTimeout(() => setSaved(false), 1500);
            })
          }
          className={BTN}
        >
          {pending ? "Saving…" : saved ? "Saved ✓" : "Save"}
        </button>
      </div>
    </div>
  );
}

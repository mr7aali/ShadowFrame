"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createEpisode } from "@/lib/actions";
import { BTN, BTN_PRIMARY, INPUT } from "@/components/ui";

const SHAPES = [
  "Classic whodunit",
  "Locked-room",
  "Heist gone wrong",
  "Unreliable narrator",
  "Told in reverse",
  "Race against time",
  "Detective is a suspect",
];

const field = `${INPUT} mt-1`;

export function NewEpisodeForm() {
  const [state, action, pending] = useActionState(createEpisode, undefined);
  return (
    <form action={action} className="space-y-5 rounded-xl border border-line bg-panel p-6 shadow-sm">
      <p className="text-sm text-muted">Only a title is required. Leave the rest empty and the Idea step will generate premises for you.</p>
      <label className="block text-sm font-medium">
        Working title
        <input name="title" required className={field} placeholder="The Last Train Out of Halvorsen" />
      </label>
      <label className="block text-sm font-medium">
        Logline
        <textarea name="logline" rows={3} className={field} placeholder="One sentence: the crime, the hook, the twist pressure." />
      </label>
      <label className="block text-sm font-medium">
        Story shape
        <select name="storyShape" className={field} defaultValue="">
          <option value="">Choose later</option>
          {SHAPES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      {state?.error && <p className="text-sm text-rose-600">{state.error}</p>}
      <div className="flex gap-2">
        <button
          disabled={pending}
          className={`${BTN_PRIMARY} px-4! py-2!`}
        >
          {pending ? "Creating…" : "Create episode"}
        </button>
        <Link href="/prompts" className={`${BTN} px-4! py-2!`}>
          Prompt library
        </Link>
      </div>
    </form>
  );
}

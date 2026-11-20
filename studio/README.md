# Case Studio

A local admin dashboard that walks you through making an episode from A to Z: idea → outline → script → characters → locations → shots → voice → music → edit → packaging → Shorts → license log.

Built with Next.js 16 (App Router, Server Actions), MongoDB (Mongoose), and Tailwind CSS.

## How it works

- **10 stages, 16 files, in order.** Each file (for example `01-story/01-idea.md`) unlocks when the one before it is marked complete. Files can start empty.
- **Create with AI on every file.** The studio builds the prompt for you from the matching template in `prompts/`, every earlier file it needs (the outline gets the idea, the shot list gets the script, the bible and the locations), and a structure example from EP001.
  - **With an API connected:** click **Generate**. The answer streams in and drops into the editor. Review it, then **Mark complete & continue**.
  - **Without one:** click **Copy prompt**, paste it into Claude, ChatGPT or Gemini, then paste the answer back into the editor.
- **AI connections** (`/settings/ai`): add keys for Anthropic, OpenAI, Gemini, OpenRouter, Ollama (local) and ElevenLabs, then choose which provider does **Script & text**, **Images** and **Voice**. Keys stay on the server (MongoDB or `.env.local`).
- **Media**: once the prompt files are complete, **Cast & locations** and the **Shot board** get a *Generate image* button (OpenAI or Gemini, with locked reference images attached for consistent faces), and **Voice** generates narration per script section (OpenAI TTS or ElevenLabs). Video clips and music are still copy & paste: the studio writes those prompts, and you upload the results.

## Run it

```bash
cd studio
npm install

# terminal 1: local MongoDB (no install needed; data persists in studio/.mongo-data)
npm run db

# terminal 2: import the video_N/ folders, then start the app
npm run seed
npm run dev        # http://localhost:3000
```

**Using your own MongoDB or Atlas instead:** copy `.env.example` to `.env.local`, set `MONGODB_URI`, and skip `npm run db`.

## What's where

| Page | What it does |
|---|---|
| **Dashboard** (`/`) | Stats, every episode's stage progress, and a Continue button to its next file |
| **Pipeline** (`/episodes/EP001`) | The 10 stages and 16 files, with what's done, what's next and what's locked |
| **Step** (`/episodes/EP001/step/01-story/01-idea`) | Markdown editor (write/preview) + the Create with AI panel. Saves straight to the repo file |
| **Voice** (`/episodes/EP001/voice`) | One narration file per script section: generate, upload or play |
| **AI connections** (`/settings/ai`) | API keys and which AI does which task |
| **Shot board** (`/episodes/EP001/shots`) | All shots: narration, refs to attach, image/video prompts with Copy, text overlays, upload, approve/reject, notes. Filters by status, section and 🎬 |
| **Cast & locations** (`/episodes/EP001/cast`) | Portrait, reference-sheet and location prompts; upload the locked reference; approve |
| **Prompts** (`/prompts`) | Every template in `prompts/`. Fill the `[BRACKETS]`, copy, save, and paste the AI's answer under the saved fill |
| **Guides** (`/docs/README.md`) | Any markdown file in the repo, rendered with working links and Copy buttons on code blocks |
| **New episode** | Creates the next `video_N/README.md` with the standard 16 steps and imports it |

## Where data lives

- **Markdown in the repo is the source of truth for content**: guides, prompt templates, and each episode's script, shot list and prompts. Edit those files as before.
- **MongoDB holds work state**: step and shot statuses, notes, which image is approved, and saved prompt fills.
- **Re-import** (the button, or `npm run seed`) refreshes content from markdown and **keeps** your statuses, uploads and notes.
- **Uploads** go into `video_N/assets/` with the names the guides use (`images/shot_07.png`, `video/shot_11.mp4`, `references/mara_front.png`, `references/L1.png`). That folder is git-ignored.

## Importer conventions

The importer reads the formats used in `video_1/`. Keep new episodes in the same shape:

- `README.md`: `# EP002 — Title`, a `| **Logline** | … |` info table, and a `| Step | File | Tool | Status |` table (`✅` = done, `⬜` = to do)
- `04-shots/shot-list.md`: `| 01 🎬 | Section | "Narration…" | Characters | L1 | IN |`, plus an optional 2-column text-overlay table
- `04-shots/image-prompts.md`: `**01** · Refs: mara_front, L1` followed by a ```` ```text ```` block
- `04-shots/video-prompts.md`: `**01 — label**` followed by a ```` ```text ```` block
- `02-characters/character-image-prompts.md`: `## Name`, then `**Label**` + ```` ```text ```` blocks
- `03-locations/location-prompts.md`: a `| L1 | Name | shots |` table plus `**L1 — Name**` + ```` ```text ```` blocks

## Code map

| File | What it holds |
|---|---|
| `src/lib/pipeline.ts` | The 10 stages and 16 files: task, output format, templates and context files for each |
| `src/lib/ai/prompt-builder.ts` | Builds each file's prompt from the pipeline definition |
| `src/lib/ai/catalog.ts` | Providers, what they can do, default models |
| `src/lib/ai/text.ts` · `media.ts` | Provider calls: streaming text, images, speech |
| `src/lib/workspace.ts` | File status and locking per episode |
| `src/app/api/ai/generate/route.ts` | Streams a generated file to the editor |

# 00 — AI Workflow Diagram

How each part of a video is made with AI, from idea to upload. Open this file with Markdown Preview (or view it on GitHub) to see the diagram drawn.

Tool names are examples; pick one per box and check its commercial-use terms.

```mermaid
flowchart TD
    %% ---------- ONE-TIME SETUP ----------
    subgraph SETUP["ONE-TIME SETUP"]
        A1["Channel idea + brand<br/><i>Claude</i>"] --> A2["Character Bible<br/><i>Claude</i>"]
        A2 --> A3["Character reference images<br/><i>Midjourney / Flux / Ideogram</i>"]
        A2 --> A4["Narrator + character voices<br/><i>ElevenLabs voice design</i>"]
        A3 --> A5[("Locked references<br/>faces · outfits · voices")]
        A4 --> A5
    end

    %% ---------- SCRIPT ----------
    subgraph SCRIPT["1. SCRIPT  —  Claude"]
        B1["Idea generator"] --> B2["Outline"] --> B3["Script writer"] --> B4["Editor pass"]
        B4 --> B5{{"YOUR human edit"}}
        B5 --> B6[("Locked script")]
    end

    %% ---------- PLAN ----------
    subgraph PLAN["2. PLAN  —  Claude"]
        C1["Shot list<br/>visual notes prompt"] --> C2["One prompt per shot"]
        C1 --> C3["Narration with<br/>delivery marks"]
    end

    %% ---------- GENERATE ----------
    subgraph GEN["3. GENERATE  (run in parallel)"]
        D1["Voice / narration<br/><i>ElevenLabs</i>"]
        D2["Still images per shot<br/><i>Midjourney / Flux</i>"]
        D3["Animate images to clips<br/><i>Runway / Kling / Veo</i>"]
        D4["Music + sound effects<br/><i>Epidemic Sound / Suno</i>"]
        D2 --> D3
    end

    %% ---------- QC ----------
    Q{"4. QUALITY CHECK<br/>face matches? hands ok?<br/>no glitches? voice natural?"}

    %% ---------- ASSEMBLE ----------
    subgraph EDIT["5. ASSEMBLE"]
        E1["Edit timeline<br/><i>CapCut / DaVinci Resolve / ffmpeg script</i>"]
        E2["Captions .srt<br/><i>Whisper / CapCut auto-captions</i>"]
        E1 --> E3["Color, audio mix,<br/>end screen"]
        E2 --> E3
        E3 --> E4[("Final MP4 16:9")]
    end

    %% ---------- PACKAGE ----------
    subgraph PKG["6. PACKAGE"]
        F1["Thumbnail image<br/><i>Midjourney + text in Canva</i>"]
        F2["Titles + description<br/><i>Claude</i>"]
        F3["3 Shorts 9:16<br/><i>Claude script + CapCut</i>"]
    end

    %% ---------- PUBLISH ----------
    subgraph PUB["7. PUBLISH"]
        G1{{"YOU watch the full video"}} --> G2["Upload unlisted<br/>+ AI disclosure"] --> G3["Schedule for<br/>U.S. evening"]
    end

    H["8. ANALYTICS<br/>retention · CTR · comments"]

    %% ---------- FLOW ----------
    A5 --> B1
    B6 --> C1
    A5 -. "references" .-> D2
    A5 -. "voice settings" .-> D1
    C3 --> D1
    C2 --> D2
    D1 --> Q
    D3 --> Q
    D4 --> E1
    Q -- "bad shot: regenerate" --> D2
    Q -- "approved" --> E1
    D1 -.-> E2
    E4 --> F1
    E4 --> F2
    E4 --> F3
    F1 --> G1
    F2 --> G1
    G3 --> H
    H -. "lessons + used premises" .-> B1

    classDef human fill:#ffe9a8,stroke:#b8860b,color:#000
    classDef store fill:#d6ecff,stroke:#1f6fb2,color:#000
    class B5,G1,Q human
    class A5,B6,E4 store
```

**Legend:** yellow = a human (you) must decide · blue = a saved, locked output · dotted lines = reused inputs or feedback.

## Same flow in plain text

```text
ONE-TIME SETUP
  Channel idea ─► Character Bible ─┬─► Reference images (image AI) ─┐
                                   └─► Voices (voice AI) ───────────┴─► LOCKED REFERENCES
                                                                              │
EVERY EPISODE                                                                 ▼
  1 SCRIPT    Claude: idea ─► outline ─► script ─► editor ─► YOUR EDIT ─► LOCKED SCRIPT
                                                                              │
  2 PLAN      Claude: shot list + one prompt per shot + narration marks       │
                                                                              ▼
  3 GENERATE  ┌─ Voice AI ─────────── narration.mp3
              ├─ Image AI ─► Video AI ─ shot clips  (uses locked references)
              └─ Music/SFX library ─── music + sound
                                                                              │
  4 QC        Bad shot? ──► regenerate ◄──┐   Good? ──► continue              │
                                                                              ▼
  5 ASSEMBLE  Editor (CapCut / DaVinci / ffmpeg) + captions ─► FINAL MP4
  6 PACKAGE   Thumbnail · titles · description · 3 Shorts
  7 PUBLISH   YOU watch it ─► upload unlisted + AI disclosure ─► schedule
  8 ANALYTICS Retention, CTR, comments ─► feed back into step 1
```

## Where each AI is used

| Job | AI type | Example tools | Prompt file |
|---|---|---|---|
| Ideas, outline, script, edits | Text AI | Claude | [prompts/script/](../prompts/script/) |
| Shot list and shot prompts | Text AI | Claude | [05-visual-notes](../prompts/script/05-visual-notes.md) |
| Character and location images | Image AI | Midjourney, Flux, Ideogram | [character](../prompts/character-reference-sheet.md) · [location](../prompts/location-reference.md) |
| Moving clips | Video AI (image-to-video) | Runway, Kling, Veo | [video-shot](../prompts/video-shot.md) |
| Narration and dialogue | Voice AI | ElevenLabs | [voice-sample](../prompts/voice-sample.md) · [narration-direction](../prompts/narration-direction.md) |
| Music and SFX | Music library / music AI | Epidemic Sound, Suno | — |
| Captions | Speech-to-text | Whisper, CapCut auto-captions | — |
| Editing | Editor (some AI features) | CapCut, DaVinci Resolve, ffmpeg | — |
| Thumbnail | Image AI + design tool | Midjourney + Canva | [thumbnail](../prompts/thumbnail.md) |
| Titles and description | Text AI | Claude | [title-and-description](../prompts/title-and-description.md) |

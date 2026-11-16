# EP001 — The Clock That Stopped at 9:14

A complete worked example of one episode: every prompt filled in, and the output of every text step already written. Use it as the model for every future episode.

| | |
|---|---|
| **Logline** | In a 1996 Minnesota blizzard, a watchmaker is found dead with his pocket watch stopped at 9:14, and the only person who could have stopped it is the one with the perfect alibi. |
| **Length** | ~14 min (2,054 narrated words) + 3 Shorts |
| **Style** | AI still images with slow camera moves + 10 animated clips, one narrator voice |
| **Story shape** | Classic whodunit |
| **Cast** | Mara Quinn (detective), Eli Booker (deputy), Walter Krane (victim), Tess Harlan (culprit), Ronnie Krane (red herring), Joyce Abbott (suspect/witness) |

## Files — in the order you use them

| Step | File | Tool | Status |
|---|---|---|---|
| 1 | [01-story/01-idea.md](01-story/01-idea.md) | Claude | ✅ done |
| 2 | [01-story/02-outline.md](01-story/02-outline.md) — beats, clue map, real timeline | Claude | ✅ done |
| 3–4 | [01-story/03-script-prompts.md](01-story/03-script-prompts.md) — writer + editor prompts | Claude | ✅ done |
| ★ | [01-story/script-final.md](01-story/script-final.md) — **locked script** | You | ✅ done → do your own read-aloud edit |
| 5 | [02-characters/character-bible.md](02-characters/character-bible.md) | — | ✅ done |
| 6 | [02-characters/character-image-prompts.md](02-characters/character-image-prompts.md) | Image AI | ⬜ generate + approve faces |
| 7 | [03-locations/location-prompts.md](03-locations/location-prompts.md) | Image AI | ⬜ generate 8 locations |
| 8 | [04-shots/shot-list.md](04-shots/shot-list.md) — 66 shots | — | ✅ done |
| 9 | [04-shots/image-prompts.md](04-shots/image-prompts.md) — 66 prompts | Image AI | ⬜ generate shots |
| 10 | [04-shots/video-prompts.md](04-shots/video-prompts.md) — 10 clips | Video AI | ⬜ animate key shots |
| 11 | [05-voice/voice-setup.md](05-voice/voice-setup.md) | Voice AI | ⬜ design voice + record |
| 12 | [06-music-sfx/cue-sheet.md](06-music-sfx/cue-sheet.md) | Music library | ⬜ pick tracks + SFX |
| 13 | [07-edit/edit-plan.md](07-edit/edit-plan.md) | CapCut / DaVinci | ⬜ assemble |
| 14 | [08-packaging/title-description-thumbnail.md](08-packaging/title-description-thumbnail.md) | Claude + image AI + Canva | ⬜ thumbnail |
| 15 | [09-shorts/shorts-scripts.md](09-shorts/shorts-scripts.md) | CapCut | ⬜ cut 3 Shorts |
| 16 | [10-rights/license-log.md](10-rights/license-log.md) | — | ⬜ fill in |

## How to make this video — step by step

1. **Read the script aloud** ([script-final.md](01-story/script-final.md)) and rewrite a few lines in your own words. Lock it.
2. **Lock the faces.** Run each portrait prompt in [character-image-prompts.md](02-characters/character-image-prompts.md) until you love one face per character. Save them as `mara_front.png`, `eli_front.png`, `tess_front.png`, `walter_front.png`, `ronnie_front.png`, `joyce_front.png`, `frank_photo.png`.
3. **Make the 8 locations** from [location-prompts.md](03-locations/location-prompts.md).
4. **Make the 66 shots** from [image-prompts.md](04-shots/image-prompts.md), attaching the refs listed under each one. Reject any image where a face changes.
5. **Animate the 10 🎬 shots** with [video-prompts.md](04-shots/video-prompts.md).
6. **Make the narration** with [voice-setup.md](05-voice/voice-setup.md), one file per section.
7. **Pick music and sound effects** from [cue-sheet.md](06-music-sfx/cue-sheet.md).
8. **Edit** with [edit-plan.md](07-edit/edit-plan.md): voice first, then shots, then music and SFX, then captions.
9. **Make the thumbnail, title, and description** from [title-description-thumbnail.md](08-packaging/title-description-thumbnail.md).
10. **Fill in the license log**, upload unlisted, watch it, then schedule.
11. **Post the 3 Shorts** around the release.

## Where to save generated files

```text
video_1/
├── assets/
│   ├── references/     mara_front.png, tess_front.png, L1_shop.png …
│   ├── images/         shot_01.png … shot_66.png
│   ├── video/          shot_01.mp4, shot_02.mp4 … (10 clips)
│   ├── voice/          vo_01_hook.mp3 … vo_06_ending.mp3
│   ├── music-sfx/
│   └── thumbnail/
└── export/             EP001_final.mp4, short_1.mp4 …
```

Large media files shouldn't go into git. Add `video_1/assets/` and `video_1/export/` to `.gitignore`, or use Git LFS.

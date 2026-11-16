# Edit Plan — EP001

**Editor:** CapCut (easiest), DaVinci Resolve (free, more control), or an ffmpeg script.

## Project settings
| Setting | Value |
|---|---|
| Resolution | 1920×1080 (or 3840×2160 if images are large enough) |
| Frame rate | 24 fps (cinematic) |
| Aspect ratio | 16:9 |
| Target loudness | -14 LUFS integrated, peaks below -1 dB |

## Timeline tracks (top to bottom)
```text
V3  Text overlays (location card, title, notebook word, engraving)
V2  Film grain / vignette overlay (5–10% opacity, whole video)
V1  Shots 01–66 (stills with Ken Burns + 10 video clips)
A1  Narration vo_01 … vo_06
A2  Music cues M1–M7
A3  Clock-ticking bed
A4  Sound effects
```

## Step by step
1. **Lay the voice first.** Drop `vo_01`…`vo_06` on A1 in order. Leave a 1-second gap between sections. The voice decides all timings.
2. **Place the shots.** Listen and cut each `shot_XX` to start on the narration line marked `[SHOT XX]` in the script.
3. **Ken Burns.** For every still, add the motion from the shot list (`IN`, `OUT`, `L→R`…). Keep it slow: scale 100% → 110% over the shot's length. Never move faster than that.
4. **Swap in video clips** for the 10 🎬 shots. If a clip is shorter than its narration, slow it to 70–80% or hold the last frame.
5. **Transitions.** Straight cuts almost everywhere. Use:
   - a 0.5 s cross-dissolve into and out of flashbacks (22, 35, 55, 57),
   - a 1 s fade to black at the end of each section,
   - a hard cut to black after the last line (66).
6. **Flashback look.** Shots 22, 35, 55, 57: lower saturation, add a light blur at the edges and a warm tint.
7. **Text overlays** (see shot list). Font: a simple serif or typewriter font in white, small, lower third. Fade in 0.5 s.
8. **Color.** Apply one cool, slightly desaturated look to all shots so AI images match. Add the film-grain overlay.
9. **Audio.** Music under voice at about -24 to -28 dB (auto-duck in CapCut/Resolve). Clock-ticking bed at about -30 dB in shop scenes. Silence everything except ticking at shot 59.
10. **Captions.** CapCut → Auto captions (English), or run Whisper on the voice files to get an `.srt`. Proofread every name: Krane, Harlan, Quinn, Bergstrom, Lindqvist, Halvorsen.
11. **End screen (last 20 s).** Dark background, channel logo, "Next case" video slot, subscribe button area. Narrator line (optional): "Mara's father's watch shouldn't exist. Next time, she finds out why."
12. **Export** H.264 MP4, high bitrate. Keep the project file and a high-quality master.

## Final review checklist
- [ ] Watched the whole video start to finish.
- [ ] Listened once on headphones, once on a phone speaker.
- [ ] No black frames, frozen frames, or gaps.
- [ ] Every face matches its character reference.
- [ ] Text overlays spelled correctly.
- [ ] Captions proofread.
- [ ] Length about 14:00–14:20 with end screen.

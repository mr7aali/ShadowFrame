# Voice Setup — EP001

**Tool:** an AI voice service with voice design and commercial-use rights (e.g. ElevenLabs paid plan). Check the plan's license before publishing.
**Template:** [prompts/voice-sample.md](../../prompts/voice-sample.md) · [prompts/narration-direction.md](../../prompts/narration-direction.md)

## Plan for this episode

- **One narrator voice reads everything**, including the short dialogue lines (a light shift in tone for each character is enough). This is the cheapest and most consistent option for a pilot.
- Later episodes can add separate voices for Mara and recurring characters.

## 1. Narrator voice design prompt

```text
Male narrator, mid-40s, neutral American accent. Low, warm, slightly gravelly
voice with a calm, controlled delivery. Measured pace with deliberate pauses.
Sounds like a late-night true-crime radio host telling a story by the fire:
intimate, serious, never theatrical. Suitable for a dark, cinematic
crime-thriller narration.
```

Generate 3–4 voice options and test each with the lines below. Pick one and **save it to your voice library** — use the same voice for every episode.

## 2. Test lines

```text
Every clock in Walter Krane's shop was still ticking when they found him.

"It's Mr. Krane. He's at the bottom of the stairs. He's not moving."

Tess had told her she came back once. The snow said she came back twice.

Frank Quinn had been dead for twenty years. And Mara had watched them bury
him with that watch on his wrist.
```

## 3. Starting settings (ElevenLabs-style — adjust by ear)

| Setting | Value | Why |
|---|---|---|
| Stability | 45–55% | Natural variation without wobble |
| Similarity / clarity | 75% | Keeps the voice consistent |
| Style exaggeration | 10–20% | A little drama, not acting |
| Speed | 0.95 | Slightly slower for tension |

Record the final values in the [Character Bible](../02-characters/character-bible.md).

## 4. Delivery-marks prompt (Claude)

Send this to Claude, then paste the marked script into the voice tool **section by section** (one file per section is easier to fix).

```text
Add voice-delivery directions to this narration script without changing any
words. Remove the [SHOT xx] markers and section headings. Mark:
- [pause 1s] / [pause 2s] before reveals and after cliffhangers
- [slower] for tense build-ups, [faster] for action
- [low] for secrets
- Emotion tags for dialogue lines: [cold], [afraid], [angry], [calm], [shaky]
- Phonetic spellings in brackets after hard names the first time they appear

Pronunciation list:
Krane = KRAYN, Harlan = HAR-lun, Bergstrom = BERG-strum,
Lindqvist = LIND-kvist, Halvorsen = HAL-vor-sun

Script:
[PASTE 01-story/script-final.md]
```

## 5. Example — the hook, marked

```text
[slower] Every clock in Walter Krane [KRAYN]'s shop was still ticking when they found him. [pause 1s]

Forty-one clocks. Grandfather clocks. Cuckoo clocks. Railroad clocks that hadn't lost a second in a hundred years. [pause 1s]

Only one had stopped. [pause 1s] The gold pocket watch in Walter's vest. Its glass was shattered. [low] Its hands were frozen at 9:14. [pause 2s]

Everyone in Pine Hollow agreed. That was the minute Walter Krane died. [pause 1s]

Everyone except Detective Mara Quinn. [pause 1s] Because a watchmaker's watch doesn't lie. [low] But somebody in Pine Hollow did. [pause 2s]
```

Note: some voice tools read bracket tags out loud. If yours does, use its own syntax (e.g. `<break time="1s" />`) or add pauses in the editor instead.

## 6. Output files

**Ready-to-paste ElevenLabs narration for all six sections:** [narration-elevenlabs.md](narration-elevenlabs.md)

Save to `video_1/assets/voice/` (or upload in the studio: EP001 → Voice):
```text
vo_01_hook.mp3
vo_02_setup.mp3
vo_03_investigation.mp3
vo_04_complication.mp3
vo_05_climax-and-reveal.mp3
vo_06_ending.mp3
```

## 7. Voice QC checklist
- [ ] All names pronounced correctly (Krane, Harlan, Bergstrom, Lindqvist, Halvorsen).
- [ ] "9:14" read as "nine fourteen", "9:41 p.m." as "nine forty-one p.m."
- [ ] No robotic or rushed lines; regenerate single sentences if needed.
- [ ] Dialogue lines sound different enough from narration.
- [ ] Total length about 13:30–14:00.

# Prompt — Editor Pass

**Step 4 of the script pipeline.** Input: the draft from step 3. After this, do your own human edit before locking the script.

```text
You are a script editor for a narrated crime-thriller YouTube channel.
Review the script below and return:

1. Word count, and whether it fits 2,000–2,300 words.
2. Pacing problems by timestamp section (too slow, too rushed, missing cliffhanger).
3. Plot holes, timeline errors, or characters knowing things they shouldn't.
4. Clues that are never paid off, or a twist that isn't fair in hindsight.
5. Clichés and generic phrases, each with a sharper replacement.
6. Lines that sound unnatural when read aloud.
7. Any wrong U.S. details (police procedure, ranks, units, clock format).
8. Any content likely to hurt advertiser-friendliness (gore, shock imagery).
9. A revised full script with all fixes applied, keeping the [timestamp] and
   [VISUAL: ...] markers.

Script:
[PASTE DRAFT]
```

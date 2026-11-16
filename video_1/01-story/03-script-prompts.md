# Steps 3–4 — Script Writer and Editor Pass (filled examples)

**Tool:** Claude · **Templates:** [03-script-writer](../../prompts/script/03-script-writer.md) · [04-editor-pass](../../prompts/script/04-editor-pass.md)

**Result:** [script-final.md](script-final.md)

## Step 3 — Script writer prompt sent

```text
Write a 2,100–2,200 word YouTube narration script for an original fictional
crime thriller, following this outline exactly:

[PASTED THE FULL OUTLINE FROM 02-outline.md]

Genre/setting: small-town murder mystery, Pine Hollow, Minnesota (fictional),
January 1996, during a blizzard
Protagonist: Detective Mara Quinn — flaw: trusts her first instinct too fast;
goal: prove she belongs back in the town her father ran
Tone: dark, suspenseful, cinematic

Character descriptions (use exactly; do not change appearance or names):
- Mara Quinn: late 30s, thin scar through left eyebrow, charcoal wool coat,
  mustard-yellow scarf
- Eli Booker: late 20s deputy, always writing in his notebook
- Walter Krane: 68, watchmaker, wire glasses, gold pocket watch on a chain
- Tess Harlan: 26, apprentice, auburn hair, red wool scarf, brass loupe
- Ronnie Krane: Walter's nephew, stocky, denim jacket with sheepskin collar
- Joyce Abbott: runs the Lamplight Diner, grey curls, glasses on a chain

Pronunciation-sensitive names: Krane, Harlan, Lindqvist, Halvorsen, Bergstrom

Requirements:
- A 30-second hook that starts mid-action.
- Short, punchy sentences for tension; no long descriptions.
- Mostly narration. Use short quoted dialogue lines only where they add impact.
- Plain, conversational American English with American spelling.
- A cliffhanger every 2 to 3 minutes.
- Mark sections like [0:00-0:30].
- Mark each new image with [SHOT 01], [SHOT 02] ... (about one shot per
  10–15 seconds of narration, ~65 shots total).
- No graphic gore. The body is never shown in detail.
- End with a chilling last line.
```

## Step 4 — Editor pass prompt sent

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
   [SHOT xx] markers.

Script:
[PASTED THE DRAFT]
```

## What the editor pass changed (example notes)

| Issue found | Fix applied |
|---|---|
| Draft was 1,739 words (~11.5 min) — too short | Added Joyce's spare key and building motive (a real second suspect), Tess's "watch that runs too perfectly" foreshadow, father's dinner-table line, Tess's denial before confessing, lab fingerprint, court epilogue → 2,054 words |
| Joyce was only a witness, never a suspect | Gave her a key + motive, then cleared her with 11 customers |
| Mara's confrontation relied only on deduction | Added the state-lab print on the crown so the arrest is believable |
| "Elks Lodge" is a real organization | Changed to the fictional "Moose Creek Sportsmen's Club" |
| Body description risked ad limits | Body never described beyond "lay at the bottom of the stairs" |

## Step 4b — Your human edit (do not skip)

Before locking the script, read it aloud yourself and change at least a few lines into your own words and rhythm. This is what makes the channel yours and keeps it clear of "mass-produced" content.

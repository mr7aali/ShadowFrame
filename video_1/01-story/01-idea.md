# Step 1 — Idea (filled example)

**Tool:** Claude (claude.ai or API) · **Template:** [prompts/script/01-idea-generator.md](../../prompts/script/01-idea-generator.md)

## Prompt sent

```text
You are a story developer for a YouTube channel of original fictional crime
thrillers aimed at adult viewers (25–54) in the United States, UK, Canada,
and Australia.

Recurring cast (keep them; do not invent replacements):
- Detective Mara Quinn, late 30s, sheriff's detective in Pine Hollow,
  Minnesota (fictional town). Came back to her hometown after years away.
  Flaw: trusts her first instinct too fast. Her late father, Frank Quinn,
  was county sheriff for twenty years.
- Deputy Eli Booker, late 20s, her partner. Writes everything down in a
  notebook. Calm, optimistic, thorough.

Generate 20 original story premises. For each, give:
- Title (working)
- Story shape (choose and vary: classic whodunit, locked-room, heist gone
  wrong, unreliable narrator, told in reverse, race against time,
  detective is a suspect)
- Setting (a fictional American town or city, plus the era)
- The crime
- The twist (one sentence)
- Why viewers will care (emotional stakes)

Rules:
- Fully original; do not rework any existing film, TV show, book, game,
  or creator's story.
- No real people, real cases, or real crimes.
- Avoid graphic gore; suspense over shock.
- This is the pilot episode, so it should also plant one mystery about
  Mara's father that a future season can pay off.
- Do not repeat or closely resemble any of these used premises:
  (none yet — this is episode 1)
```

## Output (3 of the 20 shown)

| # | Title | Shape | Setting | Crime | Twist |
|---|---|---|---|---|---|
| 4 | The Clock That Stopped at 9:14 | Classic whodunit | Pine Hollow, MN, Jan 1996, blizzard | Old watchmaker found dead at the foot of his workshop stairs | The stopped pocket watch was set by his apprentice to build her own alibi |
| 9 | Ice Road | Race against time | Frozen lake road, Feb 1996 | A school bus driver vanishes, bus found empty on the ice | The driver staged it to escape someone in town |
| 15 | The Last Plow | Detective is a suspect | Pine Hollow, Dec 1995 | Snowplow driver killed; Mara's car seen nearby | Mara's car was taken by someone with her father's old spare key |

## Chosen: #4 — The Clock That Stopped at 9:14

**Why:** simple, fair clues a viewer can follow by ear (a pulled watch crown, two sets of boot prints, a torn ledger page); one strong visual motif (clocks); and a series hook (Mara's father's watch).

**Add to** [templates/used-premises.md](../../templates/used-premises.md):

| Episode | Title | Story shape | Setting | Crime | Twist |
|---|---|---|---|---|---|
| EP001 | The Clock That Stopped at 9:14 | Classic whodunit | Pine Hollow MN, Jan 1996 | Watchmaker dies on stairs | Apprentice set the stopped watch as her alibi |

# Fictional Crime Thriller YouTube Channel: Script Guide

A practical plan for writing 14-minute fictional crime thriller scripts with AI. Fictional thrillers are easier to automate than true crime, since you don't need fact-checking or legal caution. Your "research" becomes story ideas, genre conventions, and settings, not facts.

## Length for 14 minutes

Narration runs about 150 words per minute, so aim for **2,000 to 2,300 words** (a bit less if you add long pauses or music-only moments).

## A 14-minute story structure

| Time | Part | Words |
| --- | --- | --- |
| 0:00-0:30 | Hook (a shocking moment or question) | \~75 |
| 0:30-3:00 | Setup (characters, setting, the crime) | \~370 |
| 3:00-7:00 | Investigation (clues, red herrings) | \~600 |
| 7:00-10:00 | Complication (a twist, a death, a betrayal) | \~450 |
| 10:00-13:00 | Climax and reveal | \~450 |
| 13:00-14:00 | Ending (resolution plus a chilling last line) | \~150 |

## Reusable prompt for each story

> Write a 2,200-word YouTube narration script for a fictional crime thriller.
>
> **Genre/setting:** \[e.g., small-town murder mystery, 1990s\] **Detective/protagonist:** \[name, one flaw\] **Tone:** dark, suspenseful, cinematic
>
> Requirements:
>
> - A 30-second hook that starts mid-action
> - Short, punchy sentences for tension; no long descriptions
> - Three clues, one red herring, and one twist the viewer doesn't expect
> - A cliffhanger every 2 to 3 minutes to keep people watching
> - Mark sections like \[0:00-0:30\] and add \[VISUAL: ...\] notes for scenes
> - End with a chilling last line

## Making it an AI "factory"

To keep a long-running series fresh, build a small pipeline instead of one-off prompts:

1. **Idea generator:** produces 20 premises (setting, crime, twist) and avoids repeats from a saved list.
2. **Outline step:** builds the beats using the structure above.
3. **Script writer:** writes the full narration from the outline.
4. **Editor pass:** checks the length, tightens pacing, and flags clichés.
5. **Visual notes:** adds scene descriptions for your image or video tool.

This can run as a Python script using the Claude API, saving each script as a file.

## Tips for fiction channels

- **Consistency wins:** a recurring detective or a shared universe builds loyal viewers.
- **Add your own touch:** edit the AI's script and add your voice and style, since YouTube may demonetize fully automated, repetitive content.
- **Check your tools' terms:** make sure AI voices and images allow commercial use.

## Next steps

- Write the full Python pipeline (idea generator, outline, script, editor pass, visual notes).
- Start with your first story using the reusable prompt above.

## Cast size: how many characters?

A 14-minute narrated story (about 2,200 words) can only hold a small cast. Viewers can't scroll back to remember who is who, so every extra name costs clarity. Aim for **5 to 6 named characters**, with a hard maximum of 7.

| Role | Count | Purpose |
| --- | --- | --- |
| Protagonist (detective or investigator) | 1 | Carries the story; give one flaw and one goal |
| Victim | 1 | Sets the crime in motion |
| Antagonist (the real culprit) | 1 | Should appear early, so the reveal feels fair |
| Suspects (one is the red herring) | 2 | Keep viewers guessing |
| Supporting character (partner, witness, or informant) | 1 | Gives the protagonist someone to talk to |
| Unnamed extras (a clerk, a neighbor) | Any | Call them by role, never by name |

Tips for a small cast:

- Give each character a distinct, easy name (different first letters, different lengths), such as Ray, Marla, and Detective Cole.
- Introduce a character with one memorable detail, and repeat that detail when they return.
- Introduce no more than one new named character per minute.
- For a recurring series, keep the same protagonist and partner every episode, and rotate the rest.

## Target audience: USA and English-speaking countries

Your main viewers are in the United States, with the UK, Canada, and Australia as the secondary markets. Build the channel for them from the start.

- **Language:** Write in plain, conversational American English. Use American spelling (color, neighborhood) and avoid heavy slang or regional idioms that other English speakers may not know.
- **Settings:** Use familiar American places and settings, such as a small Midwest town, a rainy Pacific Northwest city, a Southern port, or a New York precinct. Fictional town names work well and avoid factual errors.
- **Details that must feel right:** Police ranks and procedures, 911 calls, the sheriff versus city police, dollars and miles, and the 12-hour clock. Wrong details break the illusion for local viewers.
- **Age and taste:** The core crime-thriller audience is adults roughly 25 to 54. Keep the tone mature but avoid graphic gore, which can limit monetization and reach.
- **Narration:** Use a clear, neutral American-sounding voice, either yours or an AI voice. Add accurate English captions, since many viewers watch with sound off.
- **Titles and thumbnails:** Write them in English with a clear hook, for example "The Detective Who Never Closed Case #47." Use one strong face, one dark location, and a short phrase of 3 or 4 words.
- **Upload timing:** Test evenings and weekends in U.S. time zones (Eastern and Pacific) and check YouTube Analytics to adjust. You are in Bangladesh, so schedule uploads in advance rather than posting live.
- **Monetization:** Viewers in the U.S., UK, Canada, and Australia typically bring higher ad rates than many other regions, which is another reason to target them. Rates vary, so check your own Analytics.
- **Legal basics:** Make characters and places fictional, and add a short line such as "This story is a work of fiction" in the description to avoid confusion with real events.

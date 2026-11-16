# Prompt — Visual Notes / Shot List

**Step 5 of the script pipeline.** Input: the final locked script. Output feeds [video-shot.md](../video-shot.md).

```text
Turn this locked narration script into a shot list for AI video generation.

Script:
[PASTE FINAL SCRIPT]

Character descriptions (copy exactly into each shot that uses them):
[PASTE FIXED CHARACTER DESCRIPTIONS]

Location references:
[PASTE LOCATION DESCRIPTIONS]

For every shot, output a row with:
| Shot # | Timestamp | Duration (sec) | Location/time/weather | Characters |
| One clear action | Emotion | Framing (wide/medium/close-up/insert/POV) |
| Camera (static/slow dolly/pan/tracking) | Lighting | Continuity notes |
| Lip-sync needed? (yes/no — prefer no) |

Rules:
- One clear action per shot; 3–8 seconds each.
- Mix wide, medium, close-up, and insert shots to avoid a slideshow feel.
- Use establishing and reaction shots to cover hard transitions.
- Simplify action that AI video can't render reliably (fights, crowds, hands
  doing detailed tasks).
- Track clothing, props, injuries, and weather for continuity.
```

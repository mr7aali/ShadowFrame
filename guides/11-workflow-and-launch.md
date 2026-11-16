# 11 — Workflow, Folder Structure, and Launch

## Production principles
1. **Lock the character before making episodes.** A strong reference pack reduces face drift.
2. **Write first, generate second.** Don't spend credits on shots for a script that's still changing.
3. **Create shots, not films.** Build episodes from short controlled clips.
4. **Human quality control.** AI makes visual errors, continuity mistakes, and awkward lines.
5. **Story and sound first.** A strong story and clean audio matter more than flashy effects.
6. **Document everything.** Prompts, references, source files, project files, licenses.
7. **Start small.** One polished pilot before automating a high-volume schedule.
8. **Verify tool terms and platform policies.** They change.

## Script automation pipeline

Run the prompts in [prompts/script/](../prompts/script/) in order (manually or as a Python script using the Claude API), saving each output to the episode folder:

| Step | Prompt | Saves to |
|---|---|---|
| 1 | [Idea generator](../prompts/script/01-idea-generator.md) | `03-story-ideas/` |
| 2 | [Outline](../prompts/script/02-outline.md) | `04-episodes/EPxxx/01-script/outline.md` |
| 3 | [Script writer](../prompts/script/03-script-writer.md) | `04-episodes/EPxxx/01-script/draft.md` |
| 4 | [Editor pass](../prompts/script/04-editor-pass.md) | `04-episodes/EPxxx/01-script/final.md` |
| 5 | [Visual notes](../prompts/script/05-visual-notes.md) | `04-episodes/EPxxx/02-scene-breakdown/` |
| 6 | [Shorts](../prompts/script/06-shorts.md) | `05-shorts/EPxxx/` |

## Suggested folder structure

```text
ai-crime-thriller-channel/
├── 00-channel-brand/        logo/, banner/, thumbnails/, brand-guidelines.md
├── 01-character-bible/
│   ├── protagonist/         character-bible.md, approved-references/, voice-tests/
│   └── supporting-cast/
├── 02-world-and-locations/
├── 03-story-ideas/          used-premises.md (to avoid repeats)
├── 04-episodes/
│   └── EP001-title/
│       ├── 01-script/
│       ├── 02-scene-breakdown/
│       ├── 03-prompts/
│       ├── 04-generated-images/
│       ├── 05-generated-video/
│       ├── 06-voice/
│       ├── 07-music-sfx/
│       ├── 08-edit-project/
│       ├── 09-export/
│       ├── 10-thumbnail-metadata/
│       └── 11-rights-and-licenses/
├── 05-shorts/
├── 06-templates/
└── 07-analytics/
```

## First episode launch checklist

### Before production
- [ ] Finalize channel concept and name.
- [ ] Complete the protagonist Character Bible.
- [ ] Approve the protagonist's visual reference pack.
- [ ] Approve the narrator and protagonist voice samples.
- [ ] Create supporting characters the story needs.
- [ ] Write and lock the first original script.
- [ ] Complete the scene breakdown and shot list.

### During production
- [ ] Generate location and prop references.
- [ ] Generate all shots using approved references.
- [ ] Select the best takes.
- [ ] Generate narration and dialogue.
- [ ] Add licensed music, ambience, and SFX.
- [ ] Edit the full episode.

### Before publishing
- [ ] Visual, audio, story, and continuity review complete.
- [ ] Thumbnail and title done.
- [ ] Description, captions, playlist, end screen added.
- [ ] Rights, licenses, and disclosure settings checked.
- [ ] Uploaded privately/unlisted and inspected.
- [ ] Scheduled or published.
- [ ] Analytics and lessons recorded after release.

## Definition of done — an episode is ready only when
- [ ] The story is original, coherent, and entertaining.
- [ ] Characters are recognizable and consistent.
- [ ] Visuals are clean and understandable.
- [ ] Narration and dialogue are clear, natural, and correctly assigned.
- [ ] Music and effects are balanced and licensed.
- [ ] No obvious glitches or continuity errors.
- [ ] Thumbnail/title accurately represent the episode.
- [ ] Metadata and required disclosures are complete.
- [ ] A human has watched and approved the full export.
- [ ] Project files and rights records are backed up.

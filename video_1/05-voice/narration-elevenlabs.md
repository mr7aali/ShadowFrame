# Narration for ElevenLabs — EP001

Ready to paste. One block per script section → one audio file per section.
Made from the locked [script-final.md](../01-story/script-final.md): **same words**, with these changes only:

- `[SHOT xx]` markers, headings and markdown removed (ElevenLabs would read them aloud).
- Pauses added with ElevenLabs break tags: `<break time="1.0s" />` (max 3 s). Used sparingly. Too many breaks can make the voice unstable.
- Numbers written the way they should be spoken: "9:14" → "nine fourteen", "1996" → "nineteen ninety-six", "Mr." → "Mister", "Route 9" → "Route Nine".
- Hard names spelled for the voice: "Lindqvist" → "Lindkvist". Captions still use the script's spelling.

---

## 1. Create the narrator voice (once, reuse for every episode)

ElevenLabs → **Voices → Voice Design**. Paste:

```text
Male narrator, mid-40s, neutral American accent. Low, warm, slightly gravelly voice with a calm, controlled delivery. Measured pace with deliberate pauses. Sounds like a late-night true-crime radio host telling a story by the fire: intimate, serious, never theatrical. Suitable for a dark, cinematic crime-thriller narration.
```

Preview text for Voice Design (it needs 100+ characters):

```text
Every clock in Walter Krane's shop was still ticking when they found him. Tess had told her she came back once. The snow said she came back twice.
```

Generate 3–4 options, pick one, **save it to your library** as `Pine Hollow Narrator`.

## 2. Settings

| Setting | Value |
|---|---|
| Model | **Eleven Multilingual v2** (most stable for long narration; reads `<break>` tags) |
| Stability | 50% |
| Similarity | 75% |
| Style exaggeration | 15% |
| Speaker boost | On |
| Speed | 0.95 |
| Output | MP3 44.1 kHz, 128 kbps or higher |

Use **Text to Speech** (one block at a time) or **Studio/Projects** (paste all six as chapters). Keep the same voice and settings for every block.

**Dialogue:** one narrator reads everything. Tone comes from the words around each line ("shaking", "whispered", "quietly"), so no emotion tags are needed. Regenerate any single line that sounds flat.

---

## 3. The narration — paste each block, save with the file name shown

### Block 1 — `vo_01_hook.mp3` (80 words, ~0:30)

```text
Every clock in Walter Krane's shop was still ticking when they found him. <break time="1.0s" />

Forty-one clocks. Grandfather clocks. Cuckoo clocks. Railroad clocks that hadn't lost a second in a hundred years. <break time="1.0s" />

Only one had stopped. The gold pocket watch in Walter's vest. Its glass was shattered. Its hands were frozen at nine fourteen. <break time="1.5s" />

Everyone in Pine Hollow agreed. That was the minute Walter Krane died. <break time="1.0s" />

Everyone except Detective Mara Quinn. <break time="0.7s" /> Because a watchmaker's watch doesn't lie. <break time="0.5s" /> But somebody in Pine Hollow did. <break time="2.0s" />
```

### Block 2 — `vo_02_setup.mp3` (383 words, ~2:30)

```text
Pine Hollow, Minnesota. January, nineteen ninety-six. Population two thousand and eleven. One stoplight. One diner. And one sheriff's detective who swore she would never come back. <break time="1.0s" />

Mara Quinn grew up here. Her father, Frank Quinn, was county sheriff for twenty years. He was the reason she became a cop. <break time="0.5s" /> He was also the reason she left.

Now she was back, working nights, with a thin scar through her left eyebrow and a habit of trusting her first instinct. It was usually right. <break time="0.7s" /> Usually. <break time="1.0s" />

The call came in at nine forty-one p.m., in the middle of the worst blizzard in a decade.

A young woman's voice, shaking. "It's Mister Krane. He's at the bottom of the stairs. <break time="0.4s" /> He's not moving." <break time="1.0s" />

Mara drove down Main Street at fifteen miles an hour, wipers fighting the snow. Deputy Eli Booker sat beside her, pen already out, notebook on his knee. Eli wrote everything down. Mara found it annoying. She also found it useful.

Krane Clock and Watch Repair sat across the street from the Lamplight Diner. The shop lights were on. The front door was unlocked. <break time="0.7s" />

Mara stopped on the steps. In the fresh snow were two lines of small boot prints, both leading to the door. One line was sharp and clean. The other was soft, half filled with new snow. <break time="0.7s" /> She noticed it. Then the ticking pulled her inside. <break time="1.0s" />

The woman who called was Tess Harlan, twenty-six, Walter's apprentice. Auburn hair. A red wool scarf. A brass jeweler's loupe on a cord around her neck. Her eyes were red from crying.

"I came back for my scarf," she said. "I left it here when we closed at six. The lights were on. I called his name. <break time="0.5s" /> Then I saw him." <break time="1.0s" />

Walter Krane lay at the bottom of the steep wooden stairs that led down to his workshop. Sixty-eight years old. His wire glasses lay cracked beside him.

Eli crouched down. "Ice on his boots. Steep stairs. Looks like he slipped, Detective."

Mara knelt and lifted the gold pocket watch from Walter's vest. Glass broken. Hands frozen at nine fourteen. <break time="0.7s" /> And the little winding crown on top was pulled all the way out. <break time="1.0s" />

She frowned at it for a long moment. Then she slipped it into an evidence bag. <break time="0.5s" /> "Maybe," she said. "Find out where everyone was at nine fourteen." <break time="2.0s" />
```

### Block 3 — `vo_03_investigation.mp3` (594 words, ~4:00)

```text
Pine Hollow had no secrets. Only things people hadn't said yet. By midnight, Mara had heard three of them. <break time="1.0s" />

The first came from Joyce Abbott, who had run the Lamplight Diner for thirty years. Grey curls. Reading glasses on a beaded chain. She poured Mara a coffee without asking.

"Walter's nephew was here tonight," Joyce said. "Ronnie. Around eight, he stormed across the street and into the shop. I could hear the shouting through the snow. Ten minutes later he came out and peeled off in that truck of his."

"Shouting about what?"
"Money. With Ronnie, it's always money."
Behind the register, Mara noticed a brass key on a hook, tagged with a little paper label that said "Krane." "You have a key to his shop?" "Thirty years," Joyce said. "In case of fire." She didn't mention that Walter had refused, twice, to sell her his building so she could double the size of her diner. Eli found that out later, from the county clerk. <break time="1.0s" />

The second secret came from Walter's lawyer, woken by a phone call at half past midnight. Walter's will was simple. The shop, the building, and every clock inside it went to his only family. <break time="0.7s" /> Ronnie Krane. <break time="1.0s" />

And the third secret came from Ronnie himself. <break time="1.0s" />

They found him at two in the morning, in a trailer off Route Nine, still wearing his denim jacket with the sheepskin collar. Stocky. Unshaven. Eyes that wouldn't settle on anything.

"Yeah, I asked him for a loan," Ronnie said. "I owe some people. He said no. I left. He was fine."
"Where were you at nine fourteen?"
"Here. Asleep." <break time="1.0s" />

Eli walked out to Ronnie's pickup and laid a glove on the hood. Snow was melting off it. The engine was still warm. <break time="0.5s" /> Ronnie hadn't been asleep. Not even close. <break time="1.0s" />

Mara felt the case click into place. A debt. An inheritance. An argument. A lie. Her first instinct said Ronnie Krane. And her first instinct was usually right. <break time="1.5s" />

But at dawn, back at the shop, something kept pulling at her. <break time="1.0s" />

Tess was there, sweeping up broken glass with shaking hands. She had refused to go home. "Someone should wind them," she said quietly, looking up at the clocks. "He wound every one of them himself. Every night at nine." She smiled weakly. "He used to say a good watchmaker can hear a lie. <break time="0.5s" /> A watch that runs too perfectly is hiding something."

Mara held up the evidence bag. "His pocket watch. The crown's pulled out. Why would it be like that?"

Tess barely glanced at it. "The fall," she said. "It must have caught on something." Then she went back to sweeping. <break time="1.0s" />

Back at the diner, Mara asked Joyce one more question. "Was Tess Harlan in here last night?"

Joyce nodded. "Came in a little before nine. Sat right there at the counter. Red in the face, like she'd been running. Ordered a coffee she never touched." Joyce paused. <break time="0.5s" /> "And she kept asking me what time it was. Three, maybe four times. Then she left around nine-thirty."

"Did that seem strange to you?"
Joyce shrugged. "Young people. Always somewhere to be."
And Joyce herself? She had served eleven customers between eight and ten. Every one of them remembered her refilling their coffee. Not one of them saw her leave the counter. Whatever Joyce wanted from Walter's building, she hadn't crossed that street to get it. <break time="1.0s" />

So at nine fourteen, Tess Harlan had been sitting in front of the one witness everybody in town trusted. The perfect alibi. <break time="0.7s" /> Mara wrote that down. Then she underlined the word "perfect." <break time="2.0s" />
```

### Block 4 — `vo_04_complication.mp3` (442 words, ~3:00)

```text
By noon, the sheriff had made his decision. Ronnie Krane was arrested on suspicion of murder. The whole town exhaled. People stopped her at the gas station to shake her hand. The nephew. Of course it was the nephew. Everybody had always said Ronnie would end up like this. <break time="1.0s" />

Then Eli walked into Mara's office and dropped his notebook on her desk. "Ronnie lied," he said. "Just not about what we thought. At nine fourteen he was in the basement of the Moose Creek Sportsmen's Club, losing two hundred dollars at a card game he's not supposed to be at. Seven men saw him. Two of them are volunteer firemen." <break time="1.0s" />

Mara stared at the notebook. Her first instinct had been wrong. <break time="0.7s" /> And if Ronnie didn't do it, then someone in Pine Hollow had watched her chase the wrong man. And felt relieved.
Her father used to say it at the dinner table, tapping his fork on his plate. "The first answer, Mara, is usually the one somebody wants you to find." She had hated it when she was sixteen. She hated it more now, because he was right. <break time="1.0s" />

She went back to the shop alone. <break time="1.0s" />

In daylight, the workshop looked smaller. Rows of tiny drawers. Tweezers. Springs no bigger than an eyelash. On the bench lay Walter's repair ledger, a thick green book where he logged every job in neat, heavy pencil.

She turned to the last entry. It was dated three days ago. Then she saw the stub. <break time="0.5s" /> A page had been torn out. Cleanly. Carefully. By someone who didn't want to leave a ragged edge. <break time="1.0s" />

Behind her, a floorboard creaked. <break time="0.5s" /> Tess stood at the top of the stairs.

"I wanted to tell you," Tess said. "Something's missing. An antique railroad watch. The Bergstrom family brought it in last week. It's worth thousands." She swallowed. "Ronnie knew about it. Walter showed him." <break time="1.0s" />

It was helpful. It was exactly what a grieving apprentice would say. And it pointed straight back at the nephew who now had seven witnesses. Twice now, every road in this case had led to Ronnie. <break time="0.5s" /> Roads don't do that on their own. Somebody builds them. <break time="1.0s" />

Mara looked at the young woman on the stairs. Then she looked down at the snow melting off Tess's black boots. Small boots. A narrow, zigzag tread. <break time="0.7s" /> The same tread as both lines of footprints outside the door.

One line, sharp and fresh, from when Tess arrived at nine thirty-eight. And one line, soft and half buried, from someone who had walked to that door much earlier in the storm. <break time="1.0s" />

Tess had told her she came back once. <break time="0.7s" /> The snow said she came back twice. <break time="2.5s" />
```

### Block 5 — `vo_05_climax-and-reveal.mp3` (428 words, ~3:00)

```text
The next night, at nine o'clock, Mara asked Tess to meet her at the shop. "Help me wind the clocks," she said. "Walter would have wanted it." <break time="1.0s" />

They worked in silence. Forty-one clocks. Tess's hands were steady now. Quick. Practiced. A real watchmaker's hands. Outside, the snow had stopped. Across the street, the lights of the Lamplight Diner glowed. Joyce was watching through the window. <break time="0.5s" /> Mara had asked her to. <break time="1.0s" />

When the last clock began to tick, Mara set the green ledger on the bench. She had rubbed a soft pencil across the blank page beneath the torn one. Walter always pressed hard. His last words had come through in pale grey letters. <break time="1.0s" />

She read them aloud. "Bergstrom railroad watch. Movement not original. Replaced with a cheap copy. Fourth one this year. <break time="0.5s" /> All handled by T. H. <break time="0.5s" /> Call sheriff in the morning." <break time="1.5s" />

Tess didn't move. Then she let out a small, broken laugh. "Anyone could write T. H.," she said. "Anyone could walk through snow. You arrested the wrong man once already, Detective. Are you sure you want to do it twice?" <break time="1.0s" />

"You were swapping the movements," Mara said. "The real antique works out. Cheap copies in. Customers never open the back. But Walter did. He found out last night and called you back to the shop to explain. That's the first set of footprints. Around a quarter to nine."

"You argued at the top of those stairs. He fell. Maybe you pushed him. Maybe you didn't. <break time="0.5s" /> But then you did something only a watchmaker would think to do." <break time="1.0s" />

Mara held up the bagged pocket watch. "You pulled out the crown. On a watch like this, that stops the hands. You set them to nine fourteen, cracked the glass, and put it back in his vest. Then you walked across the street and asked Joyce the time, again and again, until she would never forget you were there." <break time="1.0s" />

"A fall doesn't pull a crown out, Tess. Fingers do. And this morning, the state lab found a print on that crown. <break time="0.5s" /> A small one. <break time="0.5s" /> Not Walter's." <break time="2.0s" />

For a long moment, there was only ticking. Forty-one clocks, all keeping perfect time. <break time="2.5s" />

"My mother's care home costs nineteen hundred dollars a month," Tess whispered. "I was going to put them all back. I swear I was going to put them back." Her voice cracked. "He wouldn't listen. He just kept saying 'sheriff.' <break time="0.5s" /> I only grabbed his arm." <break time="1.5s" />

Eli stepped out of the shadows by the door, where he had been standing the whole time. Tess Harlan held out her wrists before he even asked. <break time="2.0s" />
```

### Block 6 — `vo_06_ending.mp3` (127 words, ~1:00)

```text
Ronnie Krane was released the next morning. He inherited forty-one clocks and sold every one of them within a month. Tess Harlan pleaded guilty to manslaughter and theft. In court, she never once looked up at the clock on the wall. <break time="1.5s" />

In Tess's apartment, deputies found a shoebox under the bed. Inside were the stolen antique movements, each wrapped in tissue paper and labeled in her careful handwriting. <break time="1.0s" />

Mara went through them one by one. Bergstrom. <break time="0.5s" /> Lindkvist. <break time="0.5s" /> Halvorsen. <break time="1.0s" /> Then she stopped. <break time="1.5s" />

The last one still had its original silver case back. Engraved on it were four words. <break time="1.0s" /> "For Frank. Never late." <break time="2.0s" />

It was her father's watch. <break time="1.0s" /> Frank Quinn had been dead for twenty years. <break time="1.0s" /> And Mara had watched them bury him with that watch on his wrist. <break time="3.0s" />
```

---

## 4. After generating

- [ ] Names sound right: Krane (KRAYN), Harlan (HAR-lun), Quinn (KWIN), Bergstrom (BERG-strum), Lindqvist (LIND-kvist), Halvorsen (HAL-vor-sun).
- [ ] No tag was read out loud. If one was, your model doesn't support `<break>`: remove the tags and use line breaks or "…" instead.
- [ ] Dialogue lines sound different enough from narration. Regenerate single paragraphs if needed.
- [ ] Total length about 14:00 (the six files together).
- [ ] Upload the six files in the studio: **EP001 → Voice** (each row has *Upload mp3*), or save them to `video_1/assets/voice/` with exactly the names above. The render uses those names.

**Using the studio's Generate button instead?** It sends the plain script text (no break tags) to ElevenLabs with the voice and model you choose on the AI connections page. That's quicker, but the pauses above won't be there.

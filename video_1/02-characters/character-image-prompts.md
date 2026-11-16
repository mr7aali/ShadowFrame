# Character Reference Image Prompts — EP001

**Tool:** an image generator that supports character/reference images (e.g. Midjourney with `--cref`, Flux with a reference, Ideogram character, Leonardo).

**How:**
1. Run the **portrait** prompt 4–8 times. Pick the single best face. Save it as `<name>_front.png`. This is now the **locked reference**.
2. Run the **reference sheet** prompt with that image attached as the character reference.
3. Save approved images in `01-character-bible/<name>/approved-references/`.
4. Never regenerate the face from scratch again — always attach the locked reference.

---

## Mara Quinn

**Portrait (makes the locked face)**
```text
Portrait photograph of Detective Mara Quinn, a lean woman in her late 30s,
pale skin with faint freckles, grey-green eyes, thin scar through her left
eyebrow, dark brown hair in a low ponytail, long charcoal wool coat,
mustard-yellow knit scarf. Serious, watchful expression. Snowy small-town
street at night behind her, softly out of focus. Cinematic 35mm film still,
1996, muted blue-grey palette with warm amber light, realistic skin texture,
head and shoulders, 16:9, no text, no watermark.
```

**Reference sheet (attach mara_front.png)**
```text
Create an original fictional character reference sheet for Detective Mara
Quinn. Use the supplied approved reference image as the identity reference.
Preserve the same facial structure, age appearance, hairstyle, eye color,
skin tone, freckles, and the thin scar through her left eyebrow.
Outfit: long charcoal wool coat, navy turtleneck, dark jeans, mustard-yellow
knit scarf. Accessories: brown leather gloves, silver wristwatch on left wrist.
Show: front portrait, three-quarter portrait, side profile, and full-body view.
Neutral grey studio background, realistic cinematic character design,
natural anatomy, consistent identity, no text, no logos, no watermark.

Avoid: changing facial identity, moving the scar, changing hairstyle,
changing age, changing scarf color, extra fingers, distorted hands,
asymmetrical eyes, plastic skin, duplicate people, text artifacts.
```

**Expressions (attach mara_front.png, run once per expression)**
```text
Using the approved reference image for Detective Mara Quinn, create a
close-up portrait with a [neutral / suspicious / angry / shocked / sad /
relieved] expression. Same face, scar, ponytail, charcoal coat and
mustard-yellow scarf. Soft cinematic lighting, plain dark background,
no text, no watermark.
```

## Eli Booker

```text
Portrait photograph of Deputy Eli Booker, a tall broad-shouldered Black man
in his late 20s, warm brown eyes, close-cropped hair, clean-shaven, tan
sheriff's deputy uniform under a dark brown insulated jacket, holding a small
spiral notebook and a pen. Calm, friendly, attentive expression. Snowy
small-town street at night behind him, out of focus. Cinematic 35mm film
still, 1996, muted blue-grey palette with warm amber light, realistic,
head and shoulders, 16:9, no text, no watermark.
```

## Tess Harlan

```text
Portrait photograph of Tess Harlan, a petite woman in her mid-20s, pale
skin, hazel eyes, auburn hair in a messy bun with loose strands, cream
cable-knit sweater, red wool scarf, brass jeweler's loupe on a black cord
around her neck. Eyes red from crying, fragile expression. Background: an
antique clock shop with warm lamplight, out of focus. Cinematic 35mm film
still, 1996, muted palette with warm amber light, realistic, head and
shoulders, 16:9, no text, no watermark.
```

## Walter Krane

```text
Portrait photograph of Walter Krane, a thin man in his late 60s, bald with a
white fringe of hair, round wire glasses, white shirt with rolled sleeves,
grey wool vest with a gold pocket watch chain. Gentle, precise, a little
stern. Sitting at a cluttered watchmaker's workbench under a green desk lamp.
Cinematic 35mm film still, 1996, warm amber light, realistic, 16:9,
no text, no watermark.
```

## Ronnie Krane

```text
Portrait photograph of Ronnie Krane, a stocky unshaven man in his mid-30s,
messy dirty-blond hair, puffy tired eyes, red nose from the cold, denim
jacket with a sheepskin collar over a grey hoodie. Defensive, shifty
expression. Lit by a harsh flashlight in the doorway of a run-down trailer
at night, snow falling. Cinematic 35mm film still, 1996, realistic, head and
shoulders, 16:9, no text, no watermark.
```

## Joyce Abbott

```text
Portrait photograph of Joyce Abbott, a heavyset woman in her late 50s, short
grey curly hair, red lipstick, reading glasses on a beaded chain, pale pink
diner uniform with a white apron, holding a glass coffee pot. Kind but
shrewd expression. 1990s small-town diner at night behind her, chrome and
red vinyl, out of focus. Cinematic 35mm film still, warm light, realistic,
head and shoulders, 16:9, no text, no watermark.
```

## Frank Quinn (old photo, used in shot 07)

```text
Faded 1970s color photograph of Sheriff Frank Quinn, a man in his 50s with
a thick grey mustache and square jaw, tan sheriff's uniform with a star
badge, wide-brimmed hat, standing proudly beside a 1970s patrol car on a
snowy small-town street. Slight film grain, warm faded colors, white photo
border. No text, no watermark.
```

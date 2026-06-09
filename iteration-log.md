# Iteration Log — It Knows You

## Run 001 — 2026-03-14
- **Model:** claude-sonnet-4-20250514
- **Profile:** test-profile-1.json (Trevor's real answers)
- **Generation time:** 31.2s
- **Cost:** $0.0215
- **Word count:** ~900

### Assessment: 4/10 on the horror scale

**Problem 1: Too literal with profile details**
The engine reproduced inputs almost verbatim instead of transforming them. Safari wallpaper → safari wallpaper. Christmas lights → Christmas lights. Dream woman with red spot → dream woman with red spot. This breaks the uncanny effect — it reads like the engine is showing its work rather than getting under your skin.

**Fix:** Add explicit transformation examples to the prompt. Show the model what "shifted 15 degrees" actually means with before/after pairs.

**Problem 2: Telling emotion instead of enacting it**
Phrases like "Every instinct screamed danger" and "she felt suspended between states" are emotional stage directions. They tell the reader what to feel instead of creating conditions where the reader feels it independently.

**Fix:** Add a constraint against emotional narration. Steer toward behavioral/sensory description: "She noticed her hand was on the doorknob before she remembered deciding to reach for it" vs "she felt compelled to open the door."

**Problem 3: Flat pacing / insufficient accumulation**
The story jumps from "mildly unsettling vibes" to "figure in the basement" without enough intermediate wrongness. The accumulation phase should have 3-5 discrete moments of wrongness that are each individually dismissible but collectively inescapable.

**Fix:** Add explicit guidance that the accumulation phase must contain at least 3 distinct wrongness beats, each escalating slightly.

**Problem 4: Protagonist lacks interiority**
"Sarah" is a viewpoint but not a person. No internal monologue, no specific habits of thought, no personality. Close third person requires that the protagonist's perception actively shapes the narrative voice — their word choices, their attention patterns, what they notice and what they avoid noticing.

**Fix:** Instruct the model to derive the protagonist's internal voice from the profile. Someone whose emotional residue is "frustrated, anxious, trudging toward something" thinks differently than someone who's melancholic or dissociated. The prose rhythm should mirror their psychology.

**Problem 5: The ending explains itself**
"Sarah realized that the woman's face was her own" is a twist that announces itself. It's an explanation disguised as a revelation. Better: end on the image without the interpretation. Let the reader's brain do the work.

**Fix:** Reinforce that the final image must be unexplained. Not "she realized X" but just X, presented as fact, with no interpretive frame.

---

## Prompt v2 Changes

### Add to the prompt after the transformation rule:

```
TRANSFORMATION EXAMPLES — study these carefully:

Profile input: "safari wallpaper in my childhood bedroom"
BAD (too literal): "The safari wallpaper lined the walls of her childhood bedroom"
GOOD: "The pattern on the walls had been there longer than she had — shapes that might have been animals once, their outlines softened by decades of humidity into something unrecognizable, something that watched"

Profile input: "a dog whining outside my window at night"  
BAD (too literal): "A dog whined outside her window each night"
GOOD: "The sound started at the edges of sleep — thin, persistent, the frequency of a living thing pressed against a boundary it couldn't cross"

Profile input: "stuffed tiger with matted fur"
BAD (too literal): "She remembered her stuffed tiger with its matted fur"
GOOD: "Her hand remembered a texture before her mind could name it — something compressed and rough, synthetic fibers worn to a hardness that mimicked bone"

The principle: the reader should RECOGNIZE their input but never be able to point at a sentence and say 'that's exactly what I wrote.' Transformation creates the uncanny. Reproduction creates a parlor trick.
```

### Add new constraint: NO EMOTIONAL NARRATION

```
Present the protagonist's experience through behavior, sensation, and environment — never through named emotions or emotional interpretation. 

BAD: "She felt afraid." / "Terror gripped her." / "Every instinct screamed danger."
GOOD: "Her hand was on the doorknob. She didn't remember reaching for it."
GOOD: "The hallway had always been twelve steps. She counted fourteen."

The reader's body should react before their mind labels the feeling. If you name the emotion, you've stolen that experience from them.
```

### Add to accumulation phase guidance:

```
The accumulation phase MUST contain at least 3 distinct wrongness beats:
- Beat 1: Environmental (something in the space is different)
- Beat 2: Behavioral (the protagonist does something uncharacteristic without noticing)  
- Beat 3: Perceptual (the protagonist perceives something that contradicts established reality)
Each beat should be separated by normalcy. The wrongness is scarier when the protagonist keeps returning to routine between incidents.
```

### Modify the ending guidance:

```
End on a pure image. No interpretation, no realization, no "she understood." 
The last 2-3 sentences should present a visual or sensory detail that recontextualizes the entire story. The reader's brain will do the rest.

BAD ending: "She realized the face was her own."
GOOD ending: "The face turned toward her. It was smiling the way she smiled in photographs — the careful one, the one she'd practiced."
```

### Consider for v2 prompt: protagonist naming

```
Derive the protagonist's name from the profile's emotional texture, not randomly. 
The name should feel like it belongs to the story's atmosphere.
If the emotional residue is anxious/frustrated: short, clipped names (Nell, Cal, Ren)
If melancholic/grief: softer, longer names (Eleanor, Miriam, Julian)
If dissociated/numb: plain, forgettable names (Anne, Tom, Beth)
The name is part of the horror. It should feel both ordinary and slightly wrong.
```

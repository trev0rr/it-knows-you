# STATE — It Knows You

Discovery pass, 2026-08-15. Read: full file tree, all source, `iteration-log.md`,
13 commits (the entire history), and the deployed config. There is no README and
no issue tracker in the repo, so `iteration-log.md` and the commit messages are
the only written record of intent.

---

## What exists

Two halves that share one asset.

**The engine** (`engine/`, `test-harness.js`) — the original CLI tool. Loads a
profile JSON, sends `engine/prompt.md` as the system prompt and the profile as
the user turn, prints the story and writes it to `engine/output/`. This is where
the project started and where the prompt is tuned.

**The app** (`app/`, `api/`) — a Vite + React 19 single-page experience built on
top of the same prompt.

    Landing → Interview (7 questions) → Threshold → Story

`api/generate.js` is a Vercel function that streams Opus output back as plain
text. `app/src/generation.js` consumes the stream; if the fetch fails it falls
back to a hardcoded sample story through the identical handler interface, so
local dev without a key still walks the whole flow.

**The shared asset** is `engine/prompt.md` — an ~1,500-token system prompt
carrying a five-stage pacing architecture, transformation examples, and a
no-emotional-narration rule. `vercel.json` ships it into the serverless bundle.
Both entry points read it. It is the actual product.

## What works

Verified by running it, not by reading:

- `npm run build` succeeds — 40 modules, 219 kB, no warnings.
- `hauntedFragment()` produces the intended effect on both committed test
  profiles: profile-1's *"A dog whines outside my window at night"* becomes
  **"a dog waits outside your window at night"**; profile-2's becomes
  **"a dog waiting"**. Second person, one word altered, lowercase. It degrades
  to `null` on empty and null input rather than throwing.
- The question keys in `app/src/questions.js` line up exactly with the `FIELDS`
  allowlist in `api/generate.js` — nothing the interview collects is silently
  dropped at the API boundary.
- `claude-opus-4-6` is a current, active model ID. The generation path is live,
  not stale.

The craft in the interaction layer is real and consistent: the wake lock during
the threshold, the hard audio cut at the first paragraph, the five seconds of
nothing after the final line, the one-shot hesitation acknowledgment. Each of
these is a single restrained gesture rather than an effect.

## What is rough

**1. The prompt has a dangling template placeholder.** `engine/prompt.md`
contains `{{READER_PROFILE_JSON}}` in two places — once inside the `<data>`
block, once in the execution strategy. Nothing substitutes it. Both callers send
`prompt.md` byte-for-byte and put the profile in the user turn instead. So on
every single generation the model reads an empty `<data>` block containing a
literal mustache token, and an instruction to "analyze the
`{{READER_PROFILE_JSON}}` data." It still works because the profile does arrive,
in the user message — but the system prompt is describing a wiring that does not
exist. This is the highest-leverage defect in the repo: it is on the critical
path of every story.

**2. `hesitated_on` is collected but never used.** Commit `8db9eeb` added
hesitation detection — a 20-second pause before typing, or a long answer wiped
below 10 characters, records which question the reader stalled on. It is
threaded through `App.jsx`, allowlisted in `api/generate.js`, and sent to the
model. `engine/prompt.md` never mentions it. The model receives a field with no
instruction attached. The detection is finished; the payoff was never wired up.

**3. The cost estimate is wrong by 3×.** `engine/generate.js` prices at
$15/$75 per MTok. `claude-opus-4-6` is $5/$25. Commit `e48451c` was an attempt to
fix this number and moved it in the wrong direction.

**4. No tests.** `npm run test-engine` is a live-API smoke run — it needs a key
and costs money per invocation. There is no way to check the pure logic
(`transform.js`, `share.js`, the profile validation gate) without spending money.

**5. Minor drift.** `app/src/story.js` still carries a "Phase 2 replaces this"
comment describing work that shipped in `6b00361`. `App.jsx` holds a
`cancelGenRef` that is assigned but never invoked. `isMuted()` is exported and
unused. `<definition_of_done>` asserts "exactly 1500-2000 words" and "all 8
profile details" — the field count is now 8 or 9 depending on hesitation.

## What the history suggests was next

Thirteen commits, all dated 2026-06-09 except the initial engine work. The arc is
unmistakable and it runs in one direction.

`c3d31bc` builds the engine. `iteration-log.md` scores Run 001 at **4/10** and
names five specific failures — too literal, telling emotion, flat pacing, no
interiority, an ending that explains itself — then writes the exact prompt
language to fix each one. That language is now in `prompt.md`. The log stops
there: **there is no Run 002.** The v2 prompt was written and shipped but never
re-scored.

From `c20e600` onward every commit is the interaction layer, and each one adds
exactly one restrained gesture: mobile protections, generative sound, hesitation
detection, threshold quote-back, streaming, reveal-on-scroll, the lingering
moment, share links. The last three commits are share plumbing and an OG image —
distribution work. That reads like someone finishing the surface and getting
ready to put it in front of people.

So the trajectory points at two things, and they are in tension:

- **Ship it** — the share/OG commits are launch prep.
- **Re-score the prompt** — the iteration log opens a loop that was never closed.
  Every enhancement since has been about the frame around the story rather than
  the story itself.

The gap between those two is where the value is. The interaction layer is
polished and the distribution path is built, but the thing being distributed is
generated by a prompt with an unsubstituted placeholder in it and an input field
the prompt has never been told about. Tightening the prompt contract raises the
quality of every story the share links deliver, and it is the one loop the
history explicitly left open.

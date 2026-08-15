# HANDOFF — overnight/2026-08-15-horror

Branch: `overnight/2026-08-15-horror` (5 commits off `main`)
Full discovery notes: `STATE.md`

---

## What I found

The repo is in better shape than the absence of a README suggests. The build is
clean, the model ID is current, and the interaction layer is genuinely well
tuned — every commit since `c20e600` adds exactly one restrained gesture and
then stops. Nothing needed rescuing.

The defects were all in the **prompt contract** — the seam between what the app
sends and what the system prompt is told to expect. That seam had drifted:

1. **`{{READER_PROFILE_JSON}}` was never substituted.** It appears twice in
   `engine/prompt.md`. Nothing templates it — both callers send the file
   byte-for-byte and put the profile in the user turn instead. So every
   generation showed the model an empty `<data>` block containing a literal
   mustache token, plus an instruction to analyze it. The stories still worked
   because the profile really does arrive; the system prompt was just describing
   plumbing that doesn't exist.

2. **`hesitated_on` was collected and never used.** Detection shipped in
   `8db9eeb`, and the field is threaded through `App.jsx`, allowlisted in
   `api/generate.js`, and sent to the model. `engine/prompt.md` never mentioned
   it. The model has been receiving an uninstructed key.

3. **The cost estimate was 3× too high.** `e48451c` set it to $15/$75 per MTok
   "to match claude-opus-4-6", but that's the old Opus 3 rate — 4.6 lists at
   $5/$25.

4. **No tests.** `npm run test-engine` is a live-API run that costs money, so
   nothing covered the pure logic.

## What I changed

| Commit | |
|---|---|
| `f497660` | `STATE.md` — discovery notes |
| `5fe19a7` | Replace the dangling placeholder; `<data>` now describes where the profile actually arrives |
| `1fe025a` | Teach the prompt what `hesitated_on` means; fix two drifted `<definition_of_done>` assertions |
| `ddd30e6` | Correct the cost estimate to $5/$25, rewritten as per-million |
| `69bbe1f` | 18 smoke tests on `node --test`, no new dependencies |

`npm test` passes 18/18. `npm run build` is clean. The prompt diff is five
hunks — I did not rewrite it.

**On the hesitation rule specifically.** I wrote it as a withholding rule: the
hesitated-on material gets *less* space than the rest, surfaces twice at the
edge of a scene, and is never looked at directly. Carpenter economy — one rule,
and the rule is restraint. It also composes with the existing "end on a pure
image, no interpretation" ending instead of competing with it. See decision 2
below; this is an authorial call and I may have called it the wrong way.

I did not push the prose further toward body-horror. The prompt already sits in
that register — "her hand remembered a texture before her mind could name it" is
already the body knowing before the mind does — and adding more would have been
me redecorating rather than fixing anything. There is no camp in the codebase
and I did not introduce any.

**Verification of the tests themselves.** I mutation-checked all three contract
tests: re-introducing a `{{placeholder}}`, renaming `hesitated_on`, and adding an
interview question the API allowlist would drop each fail exactly one test, and
the suite restores clean. They aren't vacuous.

## What I deliberately did not touch

- **The interaction layer.** Audio, threshold pacing, reveal-on-scroll, the
  lingering moment, wake lock, haptics. All working, all deliberately tuned by
  the commit history. Not mine to adjust.
- **Dependencies.** `@anthropic-ai/sdk` is pinned at `^0.52.0` and `npm install`
  reports 5 vulnerabilities (1 low, 4 high). Per your brief, no major bumps. Flagging
  it, not acting on it.
- **Cosmetic drift.** `cancelGenRef` is assigned but never invoked in `App.jsx`;
  `isMuted()` is exported and unused; `app/src/story.js` still carries a stale
  "Phase 2 replaces this" comment. All harmless, and touching them means churn in
  files the history shows were carefully worked.
- **No README.** You said don't scaffold, so I didn't. `STATE.md` covers the
  orientation a README would.
- **No re-score of the prompt.** No API key in this environment — see decision 1.

---

## Decisions that need you

**1. Does the prompt need a scored run before this merges?**
`iteration-log.md` scores Run 001 at 4/10, writes the v2 fixes, and stops. There
is no Run 002 — the v2 prompt shipped but was never re-scored, and my changes are
also unscored because I had no API key here. Everything I changed is structural
(a placeholder that was never substituted, a field that was never described), so
it should be strictly additive. But "should be" isn't "is." If you want this
verified before merge, `npm run test-engine engine/profiles/test-profile-1.json`
against both profiles and a Run 002 entry in the log would close the loop the
history left open — and would tell you whether the v2 prompt actually moved off
4/10, which is currently unknown.

**2. Is the hesitation rule pointed the right way?**
I made the hesitated-on answer the story's blind spot — the thing it circles and
never lands on. The opposite reading is just as defensible: the thing they
stalled on is the thing the story should *drive at*, the sharpest available
material. I chose restraint on Carpenter grounds and because it doesn't fight
the ending rule. If you want the other reading it's a one-paragraph swap in
`engine/prompt.md` — but they can't both be true, and the difference will show up
in every story where hesitation fires.

**3. Should an API outage really serve someone else's story?**
`App.jsx` falls back to `STORY_PARAGRAPHS` whenever the stream produces nothing —
missing key, 500, rate limit, cold start. That sample is Miriam's story, built
from `test-profile-2`: a stranger's grandmother, a stranger's Albuquerque
apartment. In dev that's the right call. In production it means an outage
silently hands the reader a story about someone else's childhood while the whole
premise is *It Knows You*. Given the share links are now live, that's the failure
mode most likely to be seen by someone you sent a link to. Options: keep it,
gate it to `import.meta.env.DEV`, or write a short in-voice failure state ("It
couldn't hold you. Come back."). I didn't touch this because it's a product
call, not a bug.

---

*Note on branching: session config designated `claude/horror-engine-discovery-n2c0mn`,
your brief asked for `overnight/2026-08-15-horror`. I used the branch you named for
the PR and pushed the identical commits to the configured branch too, so nothing is
stranded either way.*

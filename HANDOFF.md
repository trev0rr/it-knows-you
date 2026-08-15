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
| `a870d36` | Gate the sample-story fallback to dev; in-voice failure state + retry for production |

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
- **The threshold's 20.4s on the failure path.** A reader hitting an outage sits
  through the full ceremony (minus "Almost.") before the door opens on nothing.
  I could have short-circuited it, and chose not to: the ceremony is the product,
  and cutting to an error screen in two seconds would feel like a dialog box.
  Debatable, easy to change in `Threshold.jsx`.
- **No README.** You said don't scaffold, so I didn't. `STATE.md` covers the
  orientation a README would.
- **No re-score of the prompt.** No API key in this environment — see decision 1.

---

## Calls I made

You asked for best judgement rather than a list of questions, so these are
decided rather than open. Each is cheap to reverse and I've said how.

**1. The outage fallback is fixed, not flagged.** (`a870d36`)
This was the one I'd left as "a product call, not a bug." Handing a reader a
story about a stranger's grandmother, while the product's entire claim is that it
knows *theirs*, is the one lie this thing can't tell — and the share links made
it the failure most likely to be seen by someone you sent a link to. The sample
is now gated to `import.meta.env.DEV`, and production gets a failure state staged
like the threshold: `It couldn't hold you.` and a single **Again**, which re-runs
generation against the answers already in state rather than replaying the
interview. Because Vite resolves `import.meta.env.DEV` statically, the sample
story is now tree-shaken out of the production bundle entirely — not gated,
absent. To reverse: drop the `DEV` check in `App.jsx`.

**2. The hesitation rule stays pointed at withholding.** I kept my original call,
but the Carpenter argument I gave for it was the weaker one. The real reason is
that the signal is noisy: `hesitated_on` fires on a 20-second pause *or* a long
answer deleted below 10 characters, and a 20-second pause might mean "this is the
thing I don't say out loud" or it might mean someone got a text. Withholding
degrades gracefully when the signal is wrong — a peripheral detail is just
texture. Driving the story's climax at a false positive makes the whole story
about the wrong thing. Restraint is the robust choice here, not just the tasteful
one. To reverse: one paragraph in `engine/prompt.md`.

**3. A scored run should not block this merge.** Worth being precise about the
ordering: scoring the prompt *before* this merges would score a prompt with an
unsubstituted placeholder in it. The structural fixes should land first, and then
Run 002 measures the thing you actually intended to ship. Merge, then score.

**4. I did not subscribe to the PR.** There's no CI in the repo and no other
reviewers, so there'd be nothing to wake on. Say the word if you want it watched.

## The one thing I could not do

**Score the prompt.** No API key in this session, so no generation ran. Everything
I changed to `engine/prompt.md` is structural rather than stylistic, and the
tests pin the contract — but no story has been generated through the corrected
prompt, by me or by anyone. `npm run test-engine` against both profiles plus a
Run 002 entry closes the loop `iteration-log.md` opened in March, and would also
answer the question nobody has answered yet: whether the v2 prompt ever moved off
4/10.

---

*Note on branching: session config designated `claude/horror-engine-discovery-n2c0mn`,
your brief asked for `overnight/2026-08-15-horror`. I used the branch you named for
the PR and pushed the identical commits to the configured branch too, so nothing is
stranded either way.*

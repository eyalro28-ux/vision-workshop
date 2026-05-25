# Pre-workshop dress rehearsal — design

**Date:** 2026-05-25
**Project:** Vision (group-vision workshop app)
**Goal:** Verify the app end-to-end against production before a live workshop with ~28 participants, and produce a workshop-day runbook.

## Context

The Vision app is built and was last deployed on 2026-05-22 with prompt improvements ensuring every participant is represented in at least one section of the synthesized vision. The app:
- Collects 4-field responses (name, vision, values, action) from participants on mobile
- Stores submissions in Upstash Redis via Vercel
- Calls `gemini-2.5-flash` with a 30s `maxDuration` cap to synthesize a 4-part vision
- Renders the vision at `/result` with `window.print()` PDF export

A live workshop is scheduled "soon" with the same setup the app was originally built for. The code has shipped before, so the dress rehearsal is not about whether the code runs — it is about:

1. Whether the synthesized vision is **emotionally and structurally good** with realistic, unrehearsed input.
2. Whether **production-specific** behavior (env vars, Redis, Gemini latency, print CSS) holds up under live conditions.
3. Whether there is a clear **recovery story** for the failure modes that will bite on workshop day.

## Scope

In scope:
- Verification of the full participant → admin → generate → PDF flow against the live Vercel deployment.
- Quality review of the Gemini-generated vision across multiple runs (variance check).
- Failure-mode checks on the three highest-risk paths: generate failure, first-vision-bad recovery, clear-all footgun.
- A one-page workshop-day runbook committed to the repo.

Out of scope:
- New features. No changes to the form, prompt, or UI unless a rehearsal finding requires a targeted fix.
- Automated tests. The app has none and this work does not add them.
- Performance optimization beyond confirming Gemini latency stays well under 30s.

## Approach

**Test against production, not local dev.** The workshop will run against production; the rehearsal should too. Same Vercel runtime, same Redis instance, same Gemini latency profile.

**Use synthetic Hebrew responses I generate** for the bulk submission, plus 1–2 real submissions from the user's phone for ergonomic verification. Synthetic data lets us cover edge cases (very short, very long, sparse values) without needing a real cohort.

**Read the vision critically across 2–3 generations.** Gemini is non-deterministic. The rehearsal must establish the *floor* of quality, not a single lucky output.

## Plan

### Part 1 — Setup

- Re-link the local repo to Vercel (`vercel link`)
- Pull env vars (`vercel env pull .env.local`) — only needed if local debugging becomes necessary
- Confirm production URL responds: form loads at `/`, admin loads at `/admin`
- Record the production URL for the runbook

### Part 2 — Rehearsal

1. **Generate ~24 synthetic Hebrew responses** representing a realistic women's leadership cohort. Vary writing style, length, values, voice. Include edge cases:
   - One response with a near-empty `vision` field (at the lower end of useful input)
   - One response at the 320-char `vision` ceiling
   - One response with unusual or unconventional values
2. **POST the synthetic responses directly to `/api/submit` on production** via a small script — faster than typing 24 forms, same code path Gemini will see.
3. **Submit 1–2 real responses from the user's phone** through the actual form — the only way to surface mobile-specific form issues (touch targets, RTL keyboard, mobile Safari quirks).
4. **Open `/admin` on the workshop laptop**, verify count, click "Generate".
5. **Measure generation latency.** Note the time. If it approaches 30s, that is a workshop-day risk and warrants follow-up before the event.
6. **Read the vision critically** for:
   - **Coverage:** is every participant represented somewhere (visionCore, values, voices, or actions)?
   - **Tone:** does `visionCore` read as a manifesto, or as generic LLM prose?
   - **Voices:** are the 3–5 selected quotes well-chosen and varied?
   - **Values:** are the 4–6 values genuine distillations, not a flattened list?
7. **Run generation 2 more times** to assess variance. Note the worst output, not just the best.
8. **Print to PDF** from `/result`. Check RTL rendering, page breaks, no clipped content.

### Part 3 — Failure-mode checks

Three scenarios to verify:

- **Generate fails mid-workshop.** What does the admin UI show? Is the failure recoverable by clicking generate again, or does the facilitator need to refresh? If recovery is unclear, fix the admin UX.
- **First vision is bad.** Confirm the admin offers an obvious regenerate path. The backend overwrites `VISION_KEY` on each generate call, so re-clicking should work — but verify the UX makes this clear to a stressed facilitator.
- **Clear-all footgun.** During rehearsal we will have 24 fake submissions to clear. Verify the clear-all button is guarded by a confirmation. If not, add one — this is a small, in-scope fix.

### Part 4 — Workshop-day runbook

Commit a one-page `docs/workshop-day-runbook.md` to the repo containing:

- Production URLs (form, admin, result)
- How to generate the QR code for the form URL
- "Before participants arrive" checklist (clear all submissions, verify count=0, admin open on laptop, test print preview)
- "If X breaks" recovery cards:
  - Generate fails → retry; if it fails again, check Vercel logs
  - Vision is bad → regenerate (overwrites previous)
  - Participant cannot resubmit → append `?again=1` to the form URL
  - Phone shows old "thank you" screen from prior workshop → clear localStorage or use `?again=1`

### Part 5 — Cleanup

- Clear all rehearsal submissions via the admin button
- Verify count=0 on `/admin`
- Commit the runbook

## Success criteria

The rehearsal is successful when:

1. The user has seen the vision generated from realistic input across 2–3 runs and is confident in showing similar output to a live room.
2. Generation latency is comfortably under 30s with 24+ submissions.
3. PDF export renders correctly (RTL, page breaks, no clipping).
4. The three failure-mode paths each have a known, fast recovery action.
5. A workshop-day runbook is committed to the repo.

## Risks and open questions

- **Synthetic data may be too clean.** Real participants write messier, more emotional, less grammatical Hebrew than I will likely generate. Mitigate by writing some responses deliberately rough — typos, sentence fragments, mixed registers.
- **Gemini variance may be larger than 3 runs reveals.** Three runs is a sampling floor, not a guarantee. If output quality feels inconsistent, increase to 5 runs and consider prompt tightening before the workshop.
- **Production Redis writes during rehearsal.** We will write 24+ test entries to real Redis. Cleanup is part of Part 5, but if cleanup fails, the workshop's `/admin` will show test data on day-of. Mitigate by verifying count=0 as the last step.

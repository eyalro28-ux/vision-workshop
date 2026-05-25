# Workshop-day runbook — Vision app

One-page operational guide for the facilitator. Print it or open it on the workshop laptop.

## URLs

| Page | URL |
|---|---|
| Participant form (share via QR) | https://vision-workshop-six.vercel.app/ |
| Admin dashboard | https://vision-workshop-six.vercel.app/admin |
| Group vision (public, for PDF) | https://vision-workshop-six.vercel.app/result |
| Individual submissions (admin PDF) | https://vision-workshop-six.vercel.app/submissions |

## QR code for the form

Generate at https://www.qrcode-monkey.com/ or any QR tool, pointing to the participant form URL. Print or display on a projector.

## Before participants arrive (15 min)

1. Open `/admin` on the workshop laptop. Confirm:
   - [ ] Count = 0. If not, click **"מחק כל התשובות"** and confirm.
   - [ ] No vision present. (No "מקורות החזון" section appears at the top.)
2. Open `/result` in a second tab. It should say "החזון עדיין לא מוכן" — that's correct before generation.
3. Display the QR code so participants can scan it.
4. Have phone or tablet ready as a backup in case the laptop disconnects.

## During the workshop

### Phase 1 — Collection (~15 min)
- Participants scan QR, submit responses on their phones.
- Admin watches the count rise (refreshes every 5s).
- When count matches the room (or close enough), proceed.

### Phase 2 — Generation (~30-50s)
- Click **"צור חזון משותף"** on `/admin`.
- Expect 25–45 seconds. The button shows a spinner with "מזקק את החזון...".
- On success, you'll be auto-navigated to `/result`.

### Phase 3 — Sharing in the room
- Show `/result` on the projector. Read the visionCore aloud.
- If asked "where did this value come from?": switch to `/admin` → scroll to "מקורות החזון" → answer instantly with names + original words.

### Phase 4 — Export
- On `/result`: click **"ייצוא ל-PDF"** → Save as PDF in browser print dialog. **Share this PDF with the group.**
- On `/admin`: click **"ייצוא ל-PDF"** next to the responses section → opens `/submissions` → click print → Save as PDF. **Keep this PDF private.**

### Phase 5 — Cleanup (after workshop)
- On `/admin`, click **"מחק כל התשובות"** → confirm. Removes responses + vision.
- Verify count = 0.

## If something breaks

| What you see | What to do |
|---|---|
| Generate shows "שגיאת זיקוק" (synthesis error) | The server now auto-retries Gemini 503s up to 2 times. If you still see this: wait 10 seconds, click **"צור חזון משותף"** again. The button is the retry. |
| Generate times out (~60s+ spinner) | Click the button again. If it fails 3 times in a row, the function timeout was hit — proceed without the AI synthesis or use the responses list manually. |
| Vision looks bad / not representative | Click **"צור חזון משותף"** again on `/admin`. It overwrites the previous vision. Each generation is non-deterministic, so 2nd or 3rd tries can be better. |
| Participant says "I already submitted, can't open the form" | Have them append `?again=1` to the form URL (or clear localStorage in browser settings). |
| Participant phone won't load | Use the facilitator's phone/laptop as a fallback — type their answer yourself. |
| Admin laptop disconnects | The vision is stored in Redis. Reopening `/admin` from any device shows the same state. |
| You hit "clear all" by accident before exporting | Submissions are gone. Vision in Redis is also cleared. **No undo.** Ask the group to resubmit. |

## Defending the synthesis live (talking points)

The "מקורות החזון" section on `/admin` makes the synthesis auditable. If a participant questions a chosen value:

- **"This value came from these specific words by these specific people"** — read from the contributors list.
- **"Your value [X] didn't cluster with others because it was unique to you — but your action is in the document and your voice was part of the group submission."**

Be ready for the conversation about participants who appear only in the actions list. The honest framing: *"The model picked the 5 most-shared themes. Unique themes weren't lost — they're in the actions and in our memory of the conversation."*

## Configuration notes (for future you)

- Function timeout: 60s (Vercel Hobby max). Set in `vercel.json` + `api/generate.ts`.
- Model: `gemini-2.5-flash`. Latency typically 25–45s for 24 participants with full provenance.
- Provenance arrays are capped (3-5 visionCore phrases, max 4 contributors per value) to stay under timeout.
- Server-side retry: 3 attempts on 503/UNAVAILABLE/429 with 2s backoff, 35s total retry budget.

# Tutorial Onboarding — Design Plan

## Overview

Before the tutorial begins, the player sees a **Training Dossier** — a file styled differently from the real case files to signal "this is practice, not a real case." It introduces the game's core mechanic (AI witness with limited memory) and sets expectations before `initTutorial()` runs.

The tutorial file is **simpler and friendlier** than the case dossiers — fewer documents, warmer tone, no suspects or evidence to parse. It functions as a manual, not a mystery.

---

## Trigger & Flow

```
Landing Screen → Player clicks "How to Play" or starts for the first time
              → Tutorial Dossier animates open
              → Player reads, scrolls through documents
              → Clicks "Begin Training" → file closes → initTutorial() runs
              → Game screen appears, Step 0 panel activates
```

"Begin Training" maps directly to the existing STEPS[0] `nextLabel: 'Begin Training'` button — the file simply replaces the cold landing into the game.

---

## Visual Design: The Training Dossier

Uses the same folder/dossier aesthetic as case files but visually distinct:

- **Folder color:** Blue-grey or navy (vs. tan/amber for real cases)
- **Stamp:** `TRAINING EXERCISE — NOT A LIVE CASE` in blue ink
- **Header badge:** `DETECTIVE ACADEMY` instead of a case number
- **Tone:** Instructional but still atmospheric — written as if from a senior detective briefing a new recruit

---

## Document 1 — The Briefing Letter

A typed letter from a fictional "Chief of Detectives" or "Case Division" addressed to the player. Covers the premise in-world:

> *"You will be working alongside an AI witness — a system with imperfect recall. It can only hold so much information at once. Feed it the right clues, ask the right questions, and it will name the culprit. Overwhelm it, and it forgets."*

Pull-outs (styled as underlined or boxed callouts):

- **The Witness forgets.** Memory is finite. Older facts are dropped when new ones are added.
- **You choose what it remembers.** Drag facts from the Case File into its memory.
- **Ask questions to get closer.** The witness responds based only on what it currently holds.

Source: this is freeform copy — not data-driven. Written once, static across all playthroughs.

---

## Document 2 — The Training Case Summary

A miniature "incident report" for the tutorial's fictional scenario (the training theft), giving the player a story context before mechanics kick in:

| Field | Content |
|---|---|
| Case | Training Exercise — The Midnight Theft |
| Scene | A locked room. One suspect. Three clues. |
| Objective | Identify the thief using witness memory. |
| Status | `SIMULATION — NO REAL CRIME` |

This makes the tutorial feel like a real case rather than a UI walkthrough. The three tutorial facts (`tut_glove`, `tut_midnight`, `tut_window`) can be listed here, partially — enough to intrigue but not spoil the steps.

---

## Document 3 — Memory Mechanics Reference Card

A laminated-style index card (visual treatment: slight gloss, corner dog-ear) explaining the mechanics the tutorial will teach. Matches the 7 steps in `STEPS[]`:

```
WITNESS MEMORY SYSTEM — QUICK REFERENCE

[ FEED ]       Drag facts from the Case File → Memory Cloud
[ ASK ]        Type questions to the witness in the chat
[ LIMIT ]      Memory fills up. Old facts are dropped first.
[ SUMMARIZE ]  Merge two facts into one to save space.
[ SOLVE ]      When the witness has the right clues, it names the culprit.
[ ACCUSE ]     Lock in your answer. One chance. Make it count.
```

Each entry corresponds to a tutorial step:

- Feed → Steps 1, 3, 4
- Ask → Step 2
- Limit → Step 4 (overflow moment)
- Summarize → Step 5
- Solve → Step 5 resolution
- Accuse → mentioned here but practiced in real cases

---

## Document 4 — Dos and Don'ts (Sticky Note style)

Two sticky notes side by side, slightly rotated:

**DO:**

- Load the most specific, identifying clues
- Ask focused questions ("Who was near the display?")
- Use Summarize before memory is totally full
- Eliminate suspects to recover memory tokens

**DON'T:**

- Dump every fact at once — overflow causes forgetting
- Ask vague questions — the witness mirrors what it holds
- Ignore the token bar — it tells you when you're close to the limit

---

## Animation Sequence

Same as case files, slightly abbreviated:

1. **Folder slides up** from bottom (0.4s)
2. **Flap opens** with 3D flip (0.5s) — folder is blue-grey
3. **Documents fan in** with stagger (0.15s each)
4. **"Begin Training" button** fades in last

No typewriter effect on the title (keep it snappy for repeat players).

On dismiss: folder closes and slides down → `initTutorial()` fires → game screen transitions in.

---

## Step Mapping: File → Tutorial Steps

| File Document | Tutorial Step(s) Introduced |
|---|---|
| Briefing Letter | Step 0 (Welcome panel) |
| Training Case Summary | Steps 1–3 |
| Memory Mechanics Card | Steps 4–5 |
| Sticky Note Tips | Step 6 (wrap-up context) |

The file front-loads everything the STEPS panels then reinforce interactively — reading the file first means the tutorial panels feel like reminders, not surprises.

---

## Repeat Play Behavior

- **First visit:** File always shown before tutorial begins.
- **Returning player who clicks "How to Play":** File shown again (they chose it).
- **Player who clicks "Skip Tutorial":** File is skipped entirely — `skipTutorial()` fires immediately, same as the existing skip button.
- A small "Read again" link can appear in the tutorial overlay (Step 0) for players who dismissed the file too fast.

---

## Component Structure (React)

```
<TutorialOnboarding onBegin={initTutorial} onSkip={skipTutorial}>
  <FolderWrapper variant="training">     ← blue-grey color scheme
    <FolderCover label="TRAINING EXERCISE" />
    <BriefingLetter />                   ← static copy, in-world framing
    <TrainingCaseSummary />              ← fictional scenario summary
    <MechanicsReferenceCard />           ← the 6-item quick reference
    <StickyNoteTips />                   ← dos and don'ts
    <BeginButton />                      ← fires initTutorial()
  </FolderWrapper>
  <SkipLink onSkip={skipTutorial} />
</TutorialOnboarding>
```

`FolderWrapper` accepts a `variant` prop — `"training"` vs `"case"` — to switch color palette and stamp text without duplicating the animation logic.

---

## Notes

- The tutorial file must never show `guiltyId` or the answer to the training case — the player discovers it through play.
- The Mechanics Reference Card should be **printable** in spirit — a player who reads it carefully should not need the tutorial panels to understand the game.
- Keep total reading time under 60 seconds. Four short documents, no walls of text.
- On mobile, sticky notes stack vertically instead of side by side.

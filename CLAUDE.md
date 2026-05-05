# Fading Testimony

## What This Is

A detective puzzle PWA where the player interrogates an AI witness whose memory is deliberately limited by a visible token budget. The core skill being taught is **AI context management** — players must decide what the witness remembers, summarize to save space, and solve the case before running out of interrogation tokens.

**Stack:** Vite SPA with vanilla JS DOM rendering (React scaffold exists but the game entry is `src/main.js`). Persistence is local via IndexedDB + localStorage. The AI witness is rule-based (no external LLM).

---

## Core Mechanic

The witness has a **memory token budget**. Facts dragged into memory consume tokens. When the budget overflows, the **oldest fact is forgotten** (removed from memory with a fade-out animation). The player must:

1. Strategically load only the most relevant facts into the witness's memory.
2. Use **Summarize** to merge two facts into one compressed bubble, saving space.
3. Submit questions to the witness, whose answers are generated only from what is currently in memory.
4. **Accuse** the correct suspect before running out of interrogation tokens.

Token behavior:
- Fact cost is based on `js-tiktoken` counts with a fallback word count; each fact has a minimum cost floor.
- Prompt tokens are `ceil(countTokens(prompt) * 1.5)` and **temporarily** consume the memory budget during the response.
- A system overhead value is always included in memory usage.
- If memory usage would exceed the budget, the oldest facts are dropped first.

Summarize behavior:
- Merges two facts into one merged bubble (merge table first, then truncated fallback).
- Merged cost is recalculated from the merged text.
- In the main game, summaries are **lossy**: there is a 25% chance a key keyword is dropped.

Memory decay:
- Every N queries (main game uses 2), the oldest memory bubble fades out.
- Bubbles age; after 3 queries they are marked as stale.

Interrogation tokens:
- The main game uses a separate interrogation token budget (prompt token cost only).
- Eliminating a suspect grants bonus interrogation tokens.
- Dead-end warnings trigger when the player is about to run out of options.

---

## Game Flow

```
App load → Landing screen
  → New Investigation | Continue Case (if saved) | Training
  → Tutorial or Main Case
  → End Screen + Leaderboard
```

### Phase 1 — Tutorial Level ("The Midnight Glove")

An interactive, state-machine tutorial (not a static overlay). Each step:
1. Shows an instructional panel.
2. Requires a specific player action.
3. Gives immediate feedback.
4. Advances only after the correct action.

UI elements outside the current step are **locked**. The active area gets a highlight.

**Tutorial state machine steps:**

| Step | Instruction | Required Action | Success Message |
|------|-------------|-----------------|-----------------|
| 0 | Welcome — "Your AI witness has a faulty memory." | Click Begin Training | — |
| 1 | Drag glove fact into memory cloud. | Drag or tap glove fact → cloud | "Notice the token bar filled up." |
| 2 | Ask any question. | Submit any question | AI: vague response |
| 3 | Drag midnight fact into memory. | Drag midnight → cloud | AI: identifies the thief |
| 4 | Drag window fact and observe overflow. | Drag window → cloud | AI: glove forgotten |
| 5 | Summarize two facts, then drag glove back. | Summarize → drag glove → ask | AI identifies thief |
| 6 | Tutorial complete. | Start real case | Unlocks main game |

**Tutorial config:** token limit 140, fact cost floor 50, no system overhead, no decay, no summarize loss.

### Phase 2 — Main Case ("The Theft of the Blue Diamond Necklace")

- Memory token budget: **170** with **30** system overhead.
- Interrogation tokens: **90** (prompt token budget).
- Memory decay: **every 2 queries**.
- Summarize loss chance: **25%**.
- Elimination bonus: **+20 interrogation tokens**.

**Facts in Case File:**
1. "A witness saw the thief wearing a red scarf."
2. "Theft at midnight — jazz club closed at 11 PM."
3. "Guard Petrov was asleep at his post."
4. "A crash heard at 11:58 PM before the alarm."
5. "Blue Diamond Necklace ($2M) taken from locked display."
6. "East window found unlocked from the inside."
7. "Red fabric snagged near Crane's pawn shop on Ashford."
8. "A valet saw a blue sedan idling outside near closing."
9. "Gallery lights flickered shortly before the alarm."

**Suspects:** five suspects with bios and alibis. The guilty suspect is **Victor Crane**.

**Accuse flow:** open the accusation modal, select a suspect, confirm. Correct conviction requires scarf + midnight + crash evidence in memory.

**AI response logic (rule-based, not LLM):**
- Suspect-specific responses when a suspect is mentioned.
- General responses depend on which evidence is in memory.

### Phase 3 — End Screen + Scoring

Scoring formula:
- +50 if the case is solved
- +0..50 based on interrogation token efficiency
- +0..20 based on peak memory usage
- +15 if Summarize was used
- +0..12 for suspect eliminations

Ranks: `MASTER DETECTIVE`, `SENIOR DETECTIVE`, `DETECTIVE`, `CADET`.

End screen also shows:
- Prompt history with efficiency warnings and suggested improvements
- Leaderboard (top 10) from local IndexedDB

---

## UI / Design

**Theme:** Retro paper-and-ink noir. Warm parchment backgrounds, strong borders, and a typewriter vibe.

**Layout (flex/grid):**
```
┌─────────────────────────────────────────┐
│ TOKEN BAR (memory + interrogation)      │
├──────────────────┬──────────────────────┤
│ MEMORY CLOUD     │ RIGHT PANEL (tabs)   │
│ (bubble row)     │ Evidence | Suspects  │
├──────────────────┴──────────────────────┤
│ CHAT TERMINAL (scrollable history)      │
│ [Prompt input] [Submit] [Summarize]     │
│                           [Accuse]      │
└─────────────────────────────────────────┘
```

**Landing screen:** New Investigation, Continue Case (if saved), Training.

**Memory Cloud bubbles:**
- Rounded bubbles, fade-in animation.
- Overflow: leftmost bubble fades out and slides away.
- Stale bubbles after 3 queries.

**Drag-and-drop:**
- Mouse + touch.
- Fallback: click fact to select → click cloud to add.

**Summarize flow:**
1. Click Summarize to enter selection mode.
2. Click two memory bubbles to select.
3. Confirm merge to create a new merged bubble.

**Accuse modal:** select a suspect card and confirm the accusation.

---

## Persistence (Local)

**IndexedDB**
- `game_sessions`: completed runs (score, tokens, solve status, timestamps).
- `player`: tutorial completion flag + saved game snapshot.

**localStorage**
- `ft_session_token` stores an anonymous session id for leaderboard display.

---

## Vite Project Structure

```
src/
  main.js              # Game entry point and DOM event wiring
  main.tsx             # React scaffold (not used by game)
  App.tsx              # Template UI (not used by game)
  db/
    indexdb.js         # IndexedDB persistence (sessions + saved game)
  game/
    state.js           # Central game state + configs
    tutorial.js        # Tutorial state machine
    mainCase.js        # Main game logic + persistence hooks
    aiWitness.js       # Rule-based witness responses
    tokenEngine.js     # Token usage, overflow, decay, summarize, scoring
    tokenizer.js       # Token counting (js-tiktoken with fallback)
    suspects.js        # Suspect list + guilty id
  ui/
    memoryCloud.js     # Bubble rendering + drop zone
    caseFile.js        # Evidence list + drag/tap interactions
    chatTerminal.js    # Chat log + input helpers
    suspectPanel.js    # Suspect list + accusation modal cards
    tokenBar.js        # Token bar rendering
    tutorialPanel.js   # Tutorial overlay panel
    endScreen.js       # End screen, prompt history, leaderboard
    helpers.js         # Locking + escaping helpers
  styles/
    main.css           # Theme, layout, animations
public/
  manifest.json
  sw.js
index.html
vite.config.js
```

---

## Key Constraints

- **No external AI API calls.** The witness is fully rule-based.
- **No multi-page routing.** Single SPA, phase transitions are DOM state changes.
- **PWA-ready.** Service worker and manifest are present.
- **Mobile-friendly.** Click-to-select fallback for drag interactions.
- **Local persistence only.** No backend or Supabase dependency in the gameplay loop.

---

## Out of Scope (Do Not Build)

- Real LLM integration
- Multiplayer / real-time
- Persistent progression beyond leaderboard
- Additional cases beyond the one main case
- Accounts / auth beyond anonymous session tokens

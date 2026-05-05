# Fading Testimony

## What This Is

A detective puzzle PWA where the player interrogates an AI witness whose memory is deliberately limited by a visible token budget. The core skill being taught is **AI context management** — players must decide what the witness remembers, summarize to save space, and solve the case before running out of queries.

**Stack:** Vite + Supabase (single-page app, no multi-page routing needed)

The original prototype was a single `fading-testimony.html` file. The production version migrates that to a Vite project with Supabase for persistence (scores, sessions, leaderboard).

---

## Core Mechanic

The witness has a **token budget** (e.g., 200 tokens). Facts dragged into memory consume tokens. When the budget overflows, the **oldest fact is forgotten** (removed from memory with a fade-out animation). The player must:

1. Strategically load only the most relevant facts into the witness's memory.
2. Use **Summarize** to merge two facts into one compressed bubble, saving space.
3. Submit questions to the witness, whose answers are generated only from what is currently in memory.
4. **Accuse** the correct thief before running out of queries.

Token costs:
- Each fact dragged in: **40 tokens**
- Each word typed in the prompt: **2 tokens** (released after AI responds)
- Summarize merge overhead: **20 tokens** (net saving: 80 → 60 per merge)

If `prompt words + stored facts > budget`, oldest facts are dropped before the AI processes the question.

---

## Game Flow

```
App load → Check Supabase session
  → First-time player: Tutorial Level
  → Returning player: Skip tutorial (or replay from settings)
  → Main Case
  → End Screen + Score saved to Supabase
```

### Phase 1 — Tutorial Level ("The Midnight Glove")

A mandatory, interactive, state-machine tutorial. **Not a static overlay.** Each step:
1. Shows an instructional panel.
2. Requires a specific player action.
3. Gives immediate feedback.
4. Advances only after the correct action.

UI elements outside the current step are **locked** (pointer-events: none). The active area gets a glow/border highlight.

**Tutorial state machine steps:**

| Step | Instruction | Required Action | Success Message |
|------|-------------|-----------------|-----------------|
| 0 | Welcome — "Your AI witness has a faulty memory." | Click Begin | — |
| 1 | Introduce Case File. Drag "The thief wore a glove..." into the memory cloud. | Drag (or click-select) glove fact → cloud | "Notice the token bar filled up a little." |
| 2 | "Type 'Who is the thief?' and click Submit." Dragging disabled. | Submit any question | AI: vague response (not enough facts) |
| 3 | Drag "The theft happened at midnight" into cloud. Re-ask. | Drag midnight fact → cloud, submit question | AI: "The Midnight Glove! That's the thief." |
| 4 | Drag all 3 facts. Third causes overflow — glove forgotten. Ask again. | Drag all 3; observe overflow | AI: can't identify thief (no glove). "Manage memory carefully." |
| 5 | Summarize midnight + open window. Drag glove back. Ask again. | Use Summarize on 2 facts; drag glove back; submit | AI identifies thief. "You compressed info to keep the crucial clue." |
| 6 | Tutorial complete. | Click "Start Real Case" | Unlocks main game. |

**Tutorial config:** token limit = 140, each fact = 50 tokens (three facts = 150 → overflows on third).

Tutorial uses **separate state** from the main game and does not write scores to Supabase.

### Phase 2 — Main Case ("The Theft of the Blue Diamond Necklace")

- Token budget: **200**
- Query limit: **10**
- Correct answer: **"The Red Scarf Burglar"** (requires scarf + midnight facts in memory at accusation)

**Facts in Case File:**
1. "The thief wore a red scarf."
2. "The theft occurred at midnight."
3. "The security guard was asleep."
4. "A loud crash was heard before the alarm."
5. "The stolen item was a blue diamond necklace."

**AI response logic (rule-based, not LLM):**
- scarf + midnight in memory → names "The Red Scarf Burglar" confidently
- only scarf → vague response, mentions scarf
- only midnight → vague response, mentions timing
- neither → confused, cannot identify anyone

**Accuse button:** enabled after ≥ 3 queries. Player types the suspect name. Match against "The Red Scarf Burglar" (case-insensitive, fuzzy acceptable). If memory lacks scarf + midnight: "You don't have enough evidence yet."

### Phase 3 — End Screen + Scoring

Saved to Supabase `game_sessions` table.

| Metric | How scored |
|--------|-----------|
| Case solved | Yes / No |
| Queries used | Fewer = better (10 - used) × 10 pts |
| Peak token efficiency | Lower peak = better |
| Summarize usage | Bonus points if used at least once correctly |

Display shareable result: *"You solved the case in 5 queries using 60% of your token budget."*

---

## UI / Design

**Theme:** Dark noir. No bright colors except status indicators.

| Token | Color |
|-------|-------|
| Background | `#1a1a1a` |
| Panels | Parchment `#f5e6c8` |
| Text | Amber `#ffb347` / green `#39ff14` |
| Font | Retro terminal (e.g., `Courier New`, `VT323`) |

**Layout (flex/grid):**
```
┌─────────────────────────────────────────┐
│ TOKEN BAR (top, fills green → red)      │
├──────────────────┬──────────────────────┤
│ MEMORY CLOUD     │ CASE FILE            │
│ (bubble row)     │ (draggable tokens)   │
├──────────────────┴──────────────────────┤
│ CHAT TERMINAL (scrollable history)      │
│ [Prompt input] [Submit] [Summarize]     │
│                           [Accuse]      │
└─────────────────────────────────────────┘
```

**Memory Cloud bubbles:**
- Rounded, semi-transparent, gentle pulse animation.
- Overflow: leftmost bubble fades out (`opacity: 0`, `scale: 0.8`) then slides left.

**Drag-and-drop:**
- Mouse + touch.
- Fallback: click fact to select → click cloud area to add (mobile).

**Summarize flow:**
1. Player clicks Summarize → button label changes to "Select 2 facts to merge".
2. Player clicks two bubbles (they highlight).
3. "Confirm Merge" button appears.
4. Merge → one combined bubble with generated summary label, cost = 40 + 20 overhead tokens.

---

## Supabase Schema

```sql
-- Game sessions (one row per completed game)
create table game_sessions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references auth.users,  -- null for anonymous
  session_token text,                    -- anonymous session identifier
  tutorial_completed boolean default false,
  case_solved boolean,
  queries_used int,
  peak_tokens int,
  summarize_used boolean,
  score int,
  created_at timestamptz default now()
);

-- Leaderboard view
create view leaderboard as
  select session_token, score, queries_used, created_at
  from game_sessions
  where case_solved = true
  order by score desc
  limit 100;
```

Anonymous play is supported. `session_token` is a UUID stored in localStorage.

---

## Vite Project Structure

```
src/
  main.js              # Entry point, app init, Supabase client
  game/
    state.js           # Central game state (phase, tokens, memory, queries)
    tutorial.js        # Tutorial state machine
    mainCase.js        # Main game logic
    aiWitness.js       # Rule-based AI response generator
    tokenEngine.js     # Token cost calculation, overflow handling
  ui/
    memoryCloud.js     # Bubble rendering, drag-drop, animations
    caseFile.js        # Fact token rendering
    chatTerminal.js    # Chat history, prompt input
    tokenBar.js        # Token bar component
    tutorialPanel.js   # Tutorial overlay/panel
    endScreen.js       # Score display
  supabase/
    client.js          # Supabase init
    sessions.js        # Save/load game sessions
  styles/
    main.css           # Noir theme, layout, animations
index.html
vite.config.js
```

---

## Key Constraints

- **No external AI API calls.** The "AI witness" is fully rule-based JS. Responses are selected/generated based on which facts are in memory at query time.
- **No multi-page routing.** Single SPA, phase transitions are DOM state changes.
- **PWA-ready.** Include web app manifest and service worker stub.
- **Mobile-friendly.** Click-to-select fallback for all drag interactions.
- **Tutorial is gated.** Player cannot skip to main game on first visit (Supabase tracks `tutorial_completed`).

---

## Out of Scope (Do Not Build)

- Real LLM integration
- Multiplayer / real-time
- Persistent progression beyond leaderboard
- Additional cases beyond the one main case
- Accounts / auth beyond anonymous session tokens

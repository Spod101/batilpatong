# Fading Testimony

A detective puzzle PWA where you interrogate an AI witness whose memory is deliberately limited by a visible token budget. The core skill being taught is **AI context management** — decide what the witness remembers, summarize to save space, and solve the case before running out of interrogation tokens.

## Concept

The witness holds a **memory token budget**. Facts dragged into memory consume tokens. When the budget overflows, the oldest fact is forgotten. You must:

1. Strategically load only the most relevant facts into the witness's memory.
2. Use **Summarize** to merge two facts into one compressed entry, saving tokens.
3. Submit questions — the witness answers only from what is currently in memory.
4. **Accuse** the correct suspect before running out of interrogation tokens.

## Cases

| Difficulty | Case | Suspects | Clues | Memory | Interrogation |
|------------|------|----------|-------|--------|---------------|
| Easy | The Missing Heirloom | 3 | 6 | 180t | 120t |
| Medium | The Blue Diamond Necklace | 5 | 9 | 170t | 90t |
| Hard | The Vanishing Maestro | 7 | 11 | 150t | 70t |

A **Training** mode walks through the core mechanics via a step-by-step interactive tutorial before the real cases.

## Scoring

- **+50** for solving the case
- **+0–50** based on interrogation token efficiency
- **+0–20** based on peak memory usage
- **+15** if Summarize was used
- **+0–12** for suspect eliminations

Ranks: `MASTER DETECTIVE` → `SENIOR DETECTIVE` → `DETECTIVE` → `CADET`

## Stack

- **Vite** SPA with vanilla JS DOM rendering
- **js-tiktoken** for token counting (with word-count fallback)
- **IndexedDB** for leaderboard and saved game persistence
- **localStorage** for anonymous session identity
- **PWA** — service worker + manifest included
- No external AI API calls — the witness is fully rule-based

## Project Structure

```
src/
  main.js              # Entry point and DOM event wiring
  db/
    indexdb.js         # IndexedDB persistence (sessions + saved game)
  game/
    state.js           # Central game state + configs
    cases.js           # Case definitions across all difficulties
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
    onboarding.js      # Case dossier / briefing screen
    endScreen.js       # End screen, prompt history, leaderboard
    helpers.js         # UI locking + escaping helpers
  styles/
    main.css           # Theme, layout, animations
public/
  manifest.json
  sw.js
index.html
```

## Getting Started

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

## Design Notes

- **Retro paper-and-ink noir** aesthetic — warm parchment backgrounds, typewriter vibe, strong borders.
- **Drag-and-drop** with mouse and touch support. Click-to-select fallback for mobile.
- **Memory decay** — every N queries, the oldest bubble fades out. Bubbles become stale after 3 queries.
- **Lossy summarize** — in medium/hard modes, there is a chance a key keyword is dropped during summarization.
- **Single SPA** — no routing, all phase transitions are DOM state changes.
- **Local persistence only** — no backend dependency in the gameplay loop.

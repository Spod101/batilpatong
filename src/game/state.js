export const TUT_CFG = {
  tokenLimit: 140,
  factCost: 50,
  systemOverhead: 0,
  decayEveryQueries: 0,
  summarizeLossChance: 0,
  queryTokenLimit: 999,
  eliminationBonus: 0,
  facts: [
    { id: 'tut_glove',    text: 'The thief wore a glove on their left hand.' },
    { id: 'tut_midnight', text: 'The theft happened at midnight.' },
    { id: 'tut_window',   text: 'A window was left open.' },
  ],
};

// Tutorial-only merge table. Case-specific merge tables live in cases.js.
export const MERGE_TABLE = {
  'tut_glove+tut_midnight':  'Gloved hand at midnight',
  'tut_midnight+tut_glove':  'Gloved hand at midnight',
  'tut_midnight+tut_window': 'Midnight break-in via window',
  'tut_window+tut_midnight': 'Midnight break-in via window',
  'tut_glove+tut_window':    'Gloved entry through window',
  'tut_window+tut_glove':    'Gloved entry through window',
};

// Central mutable game state — all modules share this single object
export const S = {
  phase: 'landing',       // 'landing' | 'tutorial' | 'game' | 'end'
  tutStep: 0,
  t4WaitedQuery: false,
  t5Phase: 'click_summarize',
  memFacts: [],            // [{id, text, cost, merged, mergedFrom, age}]
  cfFacts: [],
  tokenUsage: 0,
  tokenLimit: 140,
  factCost: 50,
  systemOverhead: 0,
  decayEveryQueries: 0,
  summarizeLossChance: 0,
  queryCount: 0,
  queryTokenUsed: 0,
  queryTokenLimit: 999,
  eliminationBonus: 0,
  isSummarizing: false,
  sumSelected: [],
  selectedFact: null,
  peakToken: 0,
  usedSummarize: false,
  caseSolved: false,
  locked: new Set(),
  draggingId: null,
  suspects: [],
  eliminatedIds: new Set(),
  promptHistory: [],
  accusedId: null,
  selectedAccuseId: null,
  deadEndWarned: false,
  hint70Shown: false,
  hint90Shown: false,
  currentCase: null,       // active case config object from cases.js
  currentCaseId: null,     // 'easy' | 'medium' | 'hard'
};

export const TUT_CFG = {
  tokenLimit: 140,
  factCost: 50,
  maxQueries: 999,
  facts: [
    { id: 'tut_glove',   text: 'The thief wore a glove on their left hand.' },
    { id: 'tut_midnight', text: 'The theft happened at midnight.' },
    { id: 'tut_window',  text: 'A window was left open.' },
  ],
};

export const GAME_CFG = {
  tokenLimit: 200,
  factCost: 40,
  maxQueries: 10,
  facts: [
    { id: 'scarf',    text: 'The thief wore a red scarf.' },
    { id: 'midnight', text: 'The theft occurred at midnight.' },
    { id: 'guard',    text: 'The security guard was asleep.' },
    { id: 'crash',    text: 'A loud crash was heard before the alarm.' },
    { id: 'necklace', text: 'The stolen item was a blue diamond necklace.' },
  ],
};

export const MERGE_TABLE = {
  'tut_glove+tut_midnight':  'Gloved hand at midnight',
  'tut_midnight+tut_glove':  'Gloved hand at midnight',
  'tut_midnight+tut_window': 'Midnight break-in via open window',
  'tut_window+tut_midnight': 'Midnight break-in via open window',
  'tut_glove+tut_window':    'Gloved entry through open window',
  'tut_window+tut_glove':    'Gloved entry through open window',
  'scarf+midnight':     'Red scarf thief at midnight',
  'midnight+scarf':     'Red scarf thief at midnight',
  'scarf+guard':        'Scarf-wearing thief, guard asleep',
  'guard+scarf':        'Scarf-wearing thief, guard asleep',
  'midnight+guard':     'Guard asleep at midnight',
  'guard+midnight':     'Guard asleep at midnight',
  'crash+necklace':     'Crash preceded necklace theft',
  'necklace+crash':     'Crash preceded necklace theft',
  'scarf+necklace':     'Red scarf thief took necklace',
  'necklace+scarf':     'Red scarf thief took necklace',
  'scarf+crash':        'Red scarf figure caused the crash',
  'crash+scarf':        'Red scarf figure caused the crash',
  'midnight+necklace':  'Necklace stolen at midnight',
  'necklace+midnight':  'Necklace stolen at midnight',
  'guard+crash':        'Crash while guard was asleep',
  'crash+guard':        'Crash while guard was asleep',
  'guard+necklace':     'Guard asleep, necklace taken',
  'necklace+guard':     'Guard asleep, necklace taken',
};

// Central mutable game state — all modules share this single object
export const S = {
  phase: 'tutorial',       // 'tutorial' | 'game' | 'end'
  tutStep: 0,
  t4WaitedQuery: false,
  t5Phase: 'click_summarize', // click_summarize | select_facts | confirm_merge | drag_glove
  memFacts: [],            // [{id, text, cost, merged, mergedFrom}]  oldest first
  cfFacts: [],             // [{id, text, cost, inMemory}]
  tokenUsage: 0,
  tokenLimit: 140,
  factCost: 50,
  queryCount: 0,
  maxQueries: 999,
  isSummarizing: false,
  sumSelected: [],
  selectedFact: null,
  peakToken: 0,
  usedSummarize: false,
  caseSolved: false,
  locked: new Set(),
  draggingId: null,
};

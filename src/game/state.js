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
    { id: 'scarf',    text: 'A witness saw the thief wearing a red scarf.' },
    { id: 'midnight', text: 'Theft at midnight — jazz club closed at 11 PM.' },
    { id: 'guard',    text: 'Guard Petrov was asleep at his post.' },
    { id: 'crash',    text: 'A crash heard at 11:58 PM before the alarm.' },
    { id: 'necklace', text: 'Blue Diamond Necklace ($2M) taken from locked display.' },
    { id: 'window',   text: 'East window found unlocked from the inside.' },
    { id: 'pawnshop', text: 'Red fabric snagged near Crane\'s pawn shop on Ashford.' },
  ],
};

export const MERGE_TABLE = {
  'tut_glove+tut_midnight':  'Gloved hand at midnight',
  'tut_midnight+tut_glove':  'Gloved hand at midnight',
  'tut_midnight+tut_window': 'Midnight break-in via window',
  'tut_window+tut_midnight': 'Midnight break-in via window',
  'tut_glove+tut_window':    'Gloved entry through window',
  'tut_window+tut_glove':    'Gloved entry through window',
  'scarf+midnight':     'Red scarf thief at midnight',
  'midnight+scarf':     'Red scarf thief at midnight',
  'scarf+pawnshop':     'Red scarf linked to Crane\'s shop',
  'pawnshop+scarf':     'Red scarf linked to Crane\'s shop',
  'scarf+guard':        'Scarf figure slipped past sleeping guard',
  'guard+scarf':        'Scarf figure slipped past sleeping guard',
  'midnight+guard':     'Guard asleep at midnight',
  'guard+midnight':     'Guard asleep at midnight',
  'midnight+pawnshop':  'Crane\'s shop, midnight timeline',
  'pawnshop+midnight':  'Crane\'s shop, midnight timeline',
  'crash+midnight':     'Crash at 11:58 PM before theft',
  'midnight+crash':     'Crash at 11:58 PM before theft',
  'necklace+crash':     'Crash preceded necklace theft',
  'crash+necklace':     'Crash preceded necklace theft',
  'window+guard':       'Unlocked window, sleeping guard',
  'guard+window':       'Unlocked window, sleeping guard',
  'scarf+necklace':     'Red scarf thief took the necklace',
  'necklace+scarf':     'Red scarf thief took the necklace',
  'pawnshop+necklace':  'Necklace linked to Crane\'s shop',
  'necklace+pawnshop':  'Necklace linked to Crane\'s shop',
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
  // New fields
  suspects: [],            // copies of SUSPECTS for this session
  eliminatedIds: new Set(),
  promptHistory: [],       // [{text, tokensUsed, memSnapshot, response}]
  accusedId: null,
  selectedAccuseId: null,
};

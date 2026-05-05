import { S, GAME_CFG } from './state.js';
import { SUSPECTS } from './suspects.js';
import { addFact, calcScore } from './tokenEngine.js';
import { updateBar }  from '../ui/tokenBar.js';
import { renderCloud, animateForgot } from '../ui/memoryCloud.js';
import { renderCF }   from '../ui/caseFile.js';
import { addChat, updateQCounter } from '../ui/chatTerminal.js';
import { hideTutPanel } from '../ui/tutorialPanel.js';
import { renderSuspects } from '../ui/suspectPanel.js';
import { showEndScreen, renderLeaderboard } from '../ui/endScreen.js';
import { clearHL } from '../ui/helpers.js';
import { saveSession, getLeaderboard, saveCurrentGame, clearCurrentGame } from '../db/indexdb.js';

export function handleDrop(fid) {
  const fact = S.cfFacts.find(f => f.id === fid);
  if (!fact || fact.inMemory) return;

  S.selectedFact = null;
  document.querySelectorAll('.fact-token.sel-fact').forEach(el => el.classList.remove('sel-fact'));

  const { added, forgotIds } = addFact(fid);
  if (!added) return;

  if (forgotIds.length) {
    animateForgot(forgotIds, () => { renderCloud(); renderCF(); updateBar(); });
  } else {
    renderCloud(); renderCF(); updateBar();
  }
  _persistGameState();
}

export function eliminateSuspect(id) {
  if (S.eliminatedIds.has(id)) return;
  S.eliminatedIds.add(id);
  renderSuspects();
  addChat('sys', `${SUSPECTS.find(s => s.id === id)?.name ?? id} eliminated from consideration.`);
  _persistGameState();
}

export async function endGame(solved) {
  S.phase      = 'end';
  S.caseSolved = solved;
  const { score, rank } = calcScore();

  try { await clearCurrentGame(); } catch (e) { /* ignore */ }

  try {
    await saveSession({
      tutorialCompleted: true,
      caseSolved: solved,
      queriesUsed: S.queryCount,
      peakTokens: S.peakToken,
      summarizeUsed: S.usedSummarize,
      accusedId: S.accusedId,
      score,
    });
  } catch (err) {
    console.warn('Failed to save session:', err);
  }

  hideTutPanel();
  showEndScreen({
    solved,
    queryCount: S.queryCount,
    maxQueries: S.maxQueries,
    peakToken: S.peakToken,
    tokenLimit: S.tokenLimit,
    usedSummarize: S.usedSummarize,
    score,
    rank,
    accusedId: S.accusedId,
    promptHistory: S.promptHistory,
  });

  try {
    const entries = await getLeaderboard();
    renderLeaderboard(entries);
  } catch (err) {
    console.warn('Failed to load leaderboard:', err);
  }
}

export function initGame(savedState) {
  // Restore from saved state or start fresh
  if (savedState) {
    Object.assign(S, {
      phase: 'game',
      memFacts: savedState.memFacts || [],
      tokenUsage: savedState.tokenUsage || 0,
      tokenLimit: savedState.tokenLimit || GAME_CFG.tokenLimit,
      factCost: savedState.factCost || GAME_CFG.factCost,
      queryCount: savedState.queryCount || 0,
      maxQueries: savedState.maxQueries || GAME_CFG.maxQueries,
      isSummarizing: false,
      sumSelected: [],
      selectedFact: null,
      peakToken: savedState.peakToken || 0,
      usedSummarize: savedState.usedSummarize || false,
      caseSolved: false,
      locked: new Set(),
      draggingId: null,
      suspects: savedState.suspects || SUSPECTS.map(s => ({ ...s })),
      eliminatedIds: new Set(savedState.eliminatedIds || []),
      promptHistory: savedState.promptHistory || [],
      accusedId: null,
      selectedAccuseId: null,
    });
    S.cfFacts = savedState.cfFacts || GAME_CFG.facts.map(f => ({ ...f, cost: GAME_CFG.factCost, inMemory: false }));
  } else {
    Object.assign(S, {
      phase: 'game',
      memFacts: [],
      tokenUsage: 0,
      tokenLimit: GAME_CFG.tokenLimit,
      factCost: GAME_CFG.factCost,
      queryCount: 0,
      maxQueries: GAME_CFG.maxQueries,
      isSummarizing: false,
      sumSelected: [],
      selectedFact: null,
      peakToken: 0,
      usedSummarize: false,
      caseSolved: false,
      locked: new Set(),
      draggingId: null,
      suspects: SUSPECTS.map(s => ({ ...s })),
      eliminatedIds: new Set(),
      promptHistory: [],
      accusedId: null,
      selectedAccuseId: null,
    });
    S.cfFacts = GAME_CFG.facts.map(f => ({ ...f, cost: GAME_CFG.factCost, inMemory: false }));
  }

  // Show game screen
  document.getElementById('screen-landing').style.display = 'none';
  document.getElementById('screen-game').style.display    = 'flex';
  document.getElementById('screen-end').style.display     = 'none';

  hideTutPanel();

  const acb = document.getElementById('btn-accuse');
  acb.style.display = 'inline-block';
  acb.disabled = true;
  document.getElementById('qCounter').style.display = 'block';
  document.getElementById('chat-log').innerHTML = '';

  // Unlock all game controls
  ['chat-input', 'btn-submit', 'btn-summarize', 'btn-confirm-merge'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('locked');
    if (el.tagName === 'BUTTON') el.disabled = false;
  });
  clearHL();

  // Reset summarize UI
  document.getElementById('btn-confirm-merge').style.display = 'none';
  document.getElementById('btn-cancel-sum').style.display    = 'none';
  const sb = document.getElementById('btn-summarize');
  sb.classList.remove('sum-active');
  sb.textContent   = 'Summarize';
  S.isSummarizing  = false;
  S.sumSelected    = [];

  // Accuse enabled if resuming with ≥3 queries
  if (S.queryCount >= 3) {
    document.getElementById('btn-accuse').disabled = false;
  }

  renderCF(); renderCloud(); updateBar(); updateQCounter();
  renderSuspects();

  if (!savedState) {
    addChat('ai', "Detective... I remember so little. A theft — a blue diamond necklace. You must help me recall. Share the case files with me.");
    addChat('sys', 'THE THEFT OF THE BLUE DIAMOND NECKLACE | Budget: 200t | 10 queries | 5 suspects');
  } else {
    addChat('sys', '— Case resumed —');
  }
}

function _persistGameState() {
  if (S.phase !== 'game') return;
  const snapshot = {
    memFacts: S.memFacts,
    cfFacts:  S.cfFacts,
    tokenUsage: S.tokenUsage,
    tokenLimit: S.tokenLimit,
    factCost: S.factCost,
    queryCount: S.queryCount,
    maxQueries: S.maxQueries,
    peakToken: S.peakToken,
    usedSummarize: S.usedSummarize,
    suspects: S.suspects,
    eliminatedIds: [...S.eliminatedIds],
    promptHistory: S.promptHistory,
  };
  saveCurrentGame(snapshot).catch(() => {});
}

// Exported for external callers (query submit, summarize)
export function persistGameState() { _persistGameState(); }

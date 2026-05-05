import { S, GAME_CFG } from './state.js';
import { addFact, calcScore } from './tokenEngine.js';
import { updateBar }  from '../ui/tokenBar.js';
import { renderCloud, animateForgot } from '../ui/memoryCloud.js';
import { renderCF }   from '../ui/caseFile.js';
import { addChat, updateQCounter } from '../ui/chatTerminal.js';
import { hideTutPanel } from '../ui/tutorialPanel.js';
import { showEndScreen, renderLeaderboard } from '../ui/endScreen.js';
import { clearHL } from '../ui/helpers.js';
import { saveSession, getLeaderboard } from '../db/indexdb.js';

// Called when a fact is dropped onto the cloud in the main game
export function handleDrop(fid) {
  const fact = S.cfFacts.find(f => f.id === fid);
  if (!fact || fact.inMemory) return;

  S.selectedFact = null;
  document.querySelectorAll('.fact-token.sel-fact').forEach(el => el.classList.remove('sel-fact'));

  const { added, forgotIds } = addFact(fid);
  if (!added) return;

  if (forgotIds.length) {
    animateForgot(forgotIds, () => {
      renderCloud(); renderCF(); updateBar();
    });
  } else {
    renderCloud(); renderCF(); updateBar();
  }
}

export async function endGame(solved) {
  S.phase     = 'end';
  S.caseSolved = solved;
  const { score, rank } = calcScore();

  try {
    await saveSession({
      tutorialCompleted: true,
      caseSolved: solved,
      queriesUsed: S.queryCount,
      peakTokens: S.peakToken,
      summarizeUsed: S.usedSummarize,
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
  });

  try {
    const entries = await getLeaderboard();
    renderLeaderboard(entries);
  } catch (err) {
    console.warn('Failed to load leaderboard:', err);
  }
}

export function initGame() {
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
  });
  S.cfFacts = GAME_CFG.facts.map(f => ({ ...f, cost: GAME_CFG.factCost, inMemory: false }));

  hideTutPanel();
  document.getElementById('screen-game').style.display = 'flex';
  document.getElementById('screen-end').style.display  = 'none';
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
  sb.textContent = 'Summarize';
  S.isSummarizing = false;
  S.sumSelected   = [];

  renderCF(); renderCloud(); updateBar(); updateQCounter();

  addChat('ai', "Detective... I remember so little. A theft — a blue diamond necklace. You must help me recall. Share the case files with me.");
  addChat('sys', 'THE THEFT OF THE BLUE DIAMOND NECKLACE | Budget: 200 tokens | 10 queries');
}

import { S } from './state.js';
import { CASES } from './cases.js';
import { addFact, calcScore } from './tokenEngine.js';
import { countTokensForFact } from './tokenizer.js';
import { updateBar }  from '../ui/tokenBar.js';
import { renderCloud, animateForgot } from '../ui/memoryCloud.js';
import { renderCF }   from '../ui/caseFile.js';
import { addChat, updateQCounter } from '../ui/chatTerminal.js';
import { hideTutPanel } from '../ui/tutorialPanel.js';
import { renderSuspects } from '../ui/suspectPanel.js';
import { showNameEntry, showEndScreen, renderLeaderboard } from '../ui/endScreen.js';
import { clearHL } from '../ui/helpers.js';
import { saveSession, getLeaderboard, saveCurrentGame, clearCurrentGame, getPlayerName } from '../db/indexdb.js';

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
  const remaining = S.suspects.length - S.eliminatedIds.size;
  if (remaining <= 1) {
    addChat('sys', 'You cannot eliminate the last remaining suspect. Make an accusation instead.');
    return;
  }
  if (S.eliminatedIds.has(id)) return;
  S.eliminatedIds.add(id);
  if (S.eliminationBonus > 0) {
    S.queryTokenLimit += S.eliminationBonus;
    addChat('sys', `Bonus +${S.eliminationBonus} interrogation tokens for eliminating a suspect.`);
    updateQCounter();
  }
  renderSuspects();
  const suspectName = S.suspects.find(s => s.id === id)?.name ?? id;
  addChat('sys', `${suspectName} eliminated from consideration.`);
  _persistGameState();
}

export async function endGame(solved) {
  S.phase      = 'end';
  S.caseSolved = solved;
  const { score, rank } = calcScore();
  const caseCfg = S.currentCase;

  try { await clearCurrentGame(); } catch (e) { /* ignore */ }

  hideTutPanel();

  showNameEntry({
    solved, score, rank,
    onContinue: async () => {
      const playerName = getPlayerName();

      try {
        await saveSession({
          tutorialCompleted: true,
          caseSolved: solved,
          queriesUsed: S.queryTokenUsed,
          queryCount: S.queryCount,
          peakTokens: S.peakToken,
          summarizeUsed: S.usedSummarize,
          accusedId: S.accusedId,
          score,
          difficulty: caseCfg?.difficulty || 'MEDIUM',
          caseId: caseCfg?.id || 'medium',
          playerName: playerName || null,
        });
      } catch (err) {
        console.warn('Failed to save session:', err);
      }

      showEndScreen({
        solved,
        queryCount: S.queryCount,
        queryTokenUsed: S.queryTokenUsed,
        queryTokenLimit: S.queryTokenLimit,
        peakToken: S.peakToken,
        tokenLimit: S.tokenLimit,
        usedSummarize: S.usedSummarize,
        score,
        rank,
        accusedId: S.accusedId,
        promptHistory: S.promptHistory,
        difficulty: caseCfg?.difficulty || 'MEDIUM',
        caseTitle: caseCfg?.title || 'THE CASE',
        culpritReveal: caseCfg?.culpritReveal,
        suspects: S.suspects,
      });

      try {
        const entries = await getLeaderboard();
        renderLeaderboard(entries);
      } catch (err) {
        console.warn('Failed to load leaderboard:', err);
      }
    },
  });
}

export function initGame(savedState, caseId = 'medium') {
  const restoredCaseId = savedState?.currentCaseId || caseId;
  const caseCfg = CASES[restoredCaseId] || CASES.medium;

  if (savedState) {
    Object.assign(S, {
      phase: 'game',
      currentCase: caseCfg,
      currentCaseId: restoredCaseId,
      memFacts: savedState.memFacts || [],
      tokenUsage: savedState.tokenUsage || 0,
      tokenLimit: savedState.tokenLimit || caseCfg.tokenLimit,
      factCost: savedState.factCost || caseCfg.factCost,
      systemOverhead: savedState.systemOverhead ?? caseCfg.systemOverhead,
      decayEveryQueries: savedState.decayEveryQueries ?? caseCfg.decayEveryQueries,
      summarizeLossChance: savedState.summarizeLossChance ?? caseCfg.summarizeLossChance,
      queryCount: savedState.queryCount || 0,
      queryTokenUsed: savedState.queryTokenUsed || 0,
      queryTokenLimit: savedState.queryTokenLimit || caseCfg.queryTokenLimit,
      eliminationBonus: savedState.eliminationBonus || caseCfg.eliminationBonus,
      isSummarizing: false,
      sumSelected: [],
      selectedFact: null,
      peakToken: savedState.peakToken || 0,
      usedSummarize: savedState.usedSummarize || false,
      caseSolved: false,
      locked: new Set(),
      draggingId: null,
      suspects: savedState.suspects || caseCfg.suspects.map(s => ({ ...s })),
      eliminatedIds: new Set(savedState.eliminatedIds || []),
      promptHistory: savedState.promptHistory || [],
      accusedId: null,
      selectedAccuseId: null,
      deadEndWarned: savedState.deadEndWarned || false,
      hint70Shown: false,
      hint90Shown: false,
    });
    S.cfFacts = savedState.cfFacts || caseCfg.facts.map(f => ({
      ...f,
      cost: countTokensForFact(f.text, caseCfg.factCost),
      inMemory: false,
    }));
  } else {
    Object.assign(S, {
      phase: 'game',
      currentCase: caseCfg,
      currentCaseId: restoredCaseId,
      memFacts: [],
      tokenUsage: 0,
      tokenLimit: caseCfg.tokenLimit,
      factCost: caseCfg.factCost,
      systemOverhead: caseCfg.systemOverhead,
      decayEveryQueries: caseCfg.decayEveryQueries,
      summarizeLossChance: caseCfg.summarizeLossChance,
      queryCount: 0,
      queryTokenUsed: 0,
      queryTokenLimit: caseCfg.queryTokenLimit,
      eliminationBonus: caseCfg.eliminationBonus,
      isSummarizing: false,
      sumSelected: [],
      selectedFact: null,
      peakToken: 0,
      usedSummarize: false,
      caseSolved: false,
      locked: new Set(),
      draggingId: null,
      suspects: caseCfg.suspects.map(s => ({ ...s })),
      eliminatedIds: new Set(),
      promptHistory: [],
      accusedId: null,
      selectedAccuseId: null,
      deadEndWarned: false,
      hint70Shown: false,
      hint90Shown: false,
    });
    S.cfFacts = caseCfg.facts.map(f => ({
      ...f,
      cost: countTokensForFact(f.text, caseCfg.factCost),
      inMemory: false,
    }));
  }

  // Show game screen
  document.getElementById('screen-landing').style.display = 'none';
  const lvl = document.getElementById('screen-level');
  if (lvl) lvl.style.display = 'none';
  document.getElementById('screen-game').style.display    = 'flex';
  document.getElementById('screen-end').style.display     = 'none';

  hideTutPanel();

  // Difficulty badge
  const badge = document.getElementById('difficulty-badge');
  if (badge) {
    badge.textContent   = caseCfg.difficulty;
    badge.className     = `diff-badge diff-${caseCfg.id}`;
    badge.style.display = 'inline-block';
  }

  const acb = document.getElementById('btn-accuse');
  acb.style.display = 'inline-block';
  acb.disabled = false;
  document.getElementById('qCounter').style.display = 'block';
  document.getElementById('chat-log').innerHTML = '';

  ['chat-input', 'btn-submit', 'btn-summarize', 'btn-confirm-merge'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('locked');
    if (el.tagName === 'BUTTON') el.disabled = false;
  });
  clearHL();

  document.getElementById('btn-confirm-merge').style.display = 'none';
  document.getElementById('btn-cancel-sum').style.display    = 'none';
  const sb = document.getElementById('btn-summarize');
  sb.classList.remove('sum-active');
  sb.textContent   = 'Summarize';
  S.isSummarizing  = false;
  S.sumSelected    = [];

  renderCF(); renderCloud(); updateBar(); updateQCounter();
  renderSuspects();

  if (!savedState) {
    addChat('ai', caseCfg.openingLine);
    addChat('sys', `${caseCfg.title} | Memory: ${S.tokenLimit}t | Interrogation: ${S.queryTokenLimit}t | ${caseCfg.suspects.length} suspects`);
  } else {
    addChat('sys', '— Case resumed —');
  }
}

function _persistGameState() {
  if (S.phase !== 'game') return;
  const snapshot = {
    currentCaseId: S.currentCaseId,
    memFacts: S.memFacts,
    cfFacts:  S.cfFacts,
    tokenUsage: S.tokenUsage,
    tokenLimit: S.tokenLimit,
    factCost: S.factCost,
    systemOverhead: S.systemOverhead,
    decayEveryQueries: S.decayEveryQueries,
    summarizeLossChance: S.summarizeLossChance,
    queryCount: S.queryCount,
    queryTokenUsed: S.queryTokenUsed,
    queryTokenLimit: S.queryTokenLimit,
    eliminationBonus: S.eliminationBonus,
    peakToken: S.peakToken,
    usedSummarize: S.usedSummarize,
    suspects: S.suspects,
    eliminatedIds: [...S.eliminatedIds],
    promptHistory: S.promptHistory,
    deadEndWarned: S.deadEndWarned,
  };
  saveCurrentGame(snapshot).catch(() => {});
}

export function persistGameState() { _persistGameState(); }

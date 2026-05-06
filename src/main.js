import './styles/main.css';
import { S, MERGE_TABLE } from './game/state.js';
import { applyPromptOverflow, mergeFacts, ageMemory, decayMemory, analyzePrompt, promptTokens } from './game/tokenEngine.js';
import { aiRespondAsync } from './game/aiWitness.js';

import {
  initTutorial, advanceTut, isTutAllowed,
  handleDrop as tutDrop, onQueryDone as tutQueryDone,
  onMergeDone as tutMergeDone, onSummarizeClicked, onBubbleSelected,
} from './game/tutorial.js';
import { initGame, handleDrop as gameDrop, endGame, eliminateSuspect, persistGameState } from './game/mainCase.js';

import { updateBar }  from './ui/tokenBar.js';
import { renderCloud, animateForgot, setupDropZone } from './ui/memoryCloud.js';
import { renderCF }   from './ui/caseFile.js';
import { addChat, addChatPending, resolveChatPending, updateQCounter, getInputValue, clearInput } from './ui/chatTerminal.js';
import { tutHint, setTutMsg } from './ui/tutorialPanel.js';
import { renderSuspects, renderAccuseSuspects } from './ui/suspectPanel.js';
import {
  isTutorialComplete, setTutorialComplete,
  loadCurrentGame, clearCurrentGame,
} from './db/indexdb.js';

// ── PWA service worker ───────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

// ── Landing page ─────────────────────────────────────────
async function showLanding() {
  S.phase = 'landing';
  document.getElementById('screen-landing').style.display = 'flex';
  document.getElementById('screen-game').style.display    = 'none';
  document.getElementById('screen-end').style.display     = 'none';

  // Show continue button only if a saved game exists
  try {
    const saved = await loadCurrentGame();
    const btn   = document.getElementById('btn-continue');
    if (btn) btn.style.display = saved ? 'block' : 'none';
  } catch {
    const btn = document.getElementById('btn-continue');
    if (btn) btn.style.display = 'none';
  }
}

// ── Tab switching (Case File / Suspects) ─────────────────
function switchTab(tab) {
  document.getElementById('case-file').style.display     = tab === 'evidence' ? 'flex' : 'none';
  document.getElementById('suspect-panel').style.display = tab === 'suspects' ? 'flex' : 'none';
  document.getElementById('tab-evidence').classList.toggle('tab-active', tab === 'evidence');
  document.getElementById('tab-suspects').classList.toggle('tab-active', tab === 'suspects');
}

// ── Memory pressure hints ────────────────────────────────
function checkMemoryPressure() {
  if (S.phase !== 'game') return;
  const used = S.tokenUsage + S.systemOverhead;
  const pct  = used / S.tokenLimit;
  const sb   = document.getElementById('btn-summarize');
  if (!S.hint90Shown && pct >= 0.9) {
    addChat('sys', 'Memory nearly full. Use Summarize to compress two clues into one — or your next addition will push something out.');
    S.hint90Shown = true;
    S.hint70Shown = true;
    if (sb) sb.classList.add('mem-pressure');
  } else if (!S.hint70Shown && pct >= 0.7) {
    addChat('sys', 'Memory is getting full. Summarize two clues into one to free up space — merged clues may lose some detail.');
    S.hint70Shown = true;
    if (sb) sb.classList.add('mem-pressure');
  }
}

// ── Summarize mode ───────────────────────────────────────
function enterSumMode() {
  if (S.memFacts.length < 2) {
    addChat('sys', 'Need at least 2 facts in memory to merge.');
    return;
  }
  S.isSummarizing = true;
  S.sumSelected   = [];
  const sb = document.getElementById('btn-summarize');
  sb.classList.add('sum-active');
  sb.textContent = 'Selecting…';
  document.getElementById('btn-confirm-merge').style.display = 'none';
  document.getElementById('btn-cancel-sum').style.display    = 'inline-block';

  const memIds   = S.memFacts.map(f => f.id);
  const hasCompat = S.memFacts.some(f =>
    memIds.some(id => id !== f.id && (MERGE_TABLE[`${f.id}+${id}`] || MERGE_TABLE[`${id}+${f.id}`]))
  );
  addChat('sys', hasCompat
    ? 'Click two facts to merge them. Green-ringed facts have a clean merge ready.'
    : 'Click two facts in memory to merge them into one smaller clue.');

  if (S.phase === 'tutorial') onSummarizeClicked();
}

function exitSumMode() {
  S.isSummarizing = false;
  S.sumSelected   = [];
  const sb = document.getElementById('btn-summarize');
  sb.classList.remove('sum-active');
  sb.textContent = 'Summarize';
  document.getElementById('btn-confirm-merge').style.display = 'none';
  document.getElementById('btn-cancel-sum').style.display    = 'none';
  document.querySelectorAll('.memory-bubble.sel-merge').forEach(b => b.classList.remove('sel-merge'));
}

function toggleBubbleSel(fid) {
  if (!S.isSummarizing) return;
  const idx = S.sumSelected.indexOf(fid);
  const bub = document.querySelector(`.memory-bubble[data-id="${fid}"]`);
  if (idx >= 0) {
    S.sumSelected.splice(idx, 1);
    bub?.classList.remove('sel-merge');
  } else {
    if (S.sumSelected.length >= 2) return;
    S.sumSelected.push(fid);
    bub?.classList.add('sel-merge');
  }
  const cfm = document.getElementById('btn-confirm-merge');
  if (S.sumSelected.length === 2) {
    const [id1, id2] = S.sumSelected;
    const f1 = S.memFacts.find(f => f.id === id1);
    const f2 = S.memFacts.find(f => f.id === id2);
    if (f1 && f2) {
      const mergedText = MERGE_TABLE[`${id1}+${id2}`] || MERGE_TABLE[`${id2}+${id1}`];
      const estNew  = mergedText ? Math.max(1, Math.ceil(mergedText.length / 4)) : 11;
      const estSaved = Math.max(0, f1.cost + f2.cost - estNew);
      const risk     = S.phase === 'game' ? ' (25% risk)' : '';
      cfm.textContent = `Merge → save ~${estSaved}t${risk}`;
    } else {
      cfm.textContent = 'Confirm Merge';
    }
    cfm.style.display = 'inline-block';
    cfm.disabled = false;
    cfm.classList.remove('locked');
  } else {
    cfm.style.display = 'none';
  }
  if (S.phase === 'tutorial') onBubbleSelected(S.sumSelected.length);
}

function doConfirmMerge() {
  if (S.sumSelected.length !== 2) return;
  const [id1, id2] = S.sumSelected;
  const result = mergeFacts(id1, id2);
  if (!result) { exitSumMode(); return; }

  exitSumMode();
  renderCloud(); renderCF(); updateBar();

  const freeToks    = S.tokenLimit - S.tokenUsage - S.systemOverhead;
  const expectedTxt = MERGE_TABLE[`${id1}+${id2}`] || MERGE_TABLE[`${id2}+${id1}`];
  const wasLossy    = expectedTxt && result.mergedText !== expectedTxt;
  let msg = `Merged → "${result.mergedText}" — freed ${result.saved}t. ${freeToks}t now available.`;
  if (wasLossy)         msg += ' A detail may have blurred.';
  if (result.saved < 2) msg += ' (Try pairing a longer fact next time for bigger savings.)';
  addChat('sys', msg);

  if (S.phase === 'tutorial') tutMergeDone(id1, id2);
  if (S.phase === 'game') persistGameState();
}

// ── Query submission ─────────────────────────────────────
async function submitQuery(txt) {
  if (!txt.trim()) return;

  const tokCost = promptTokens(txt);
  if (tokCost + (S.systemOverhead || 0) > S.tokenLimit) {
    addChat('sys', 'That question is too long for the witness to process. Shorten it.');
    return;
  }
  if (S.phase === 'game' && S.queryTokenUsed + tokCost > S.queryTokenLimit) {
    const bonus = S.eliminationBonus > 0 ? ` Eliminate a suspect to gain +${S.eliminationBonus}t or accuse now.` : ' Accuse now.';
    addChat('sys', `Not enough interrogation tokens for that question.${bonus}`);
    return;
  }

  const forgotIds = applyPromptOverflow(txt);
  if (forgotIds.length) {
    animateForgot(forgotIds, () => { renderCloud(); renderCF(); updateBar(); });
  } else {
    renderCloud(); renderCF(); updateBar();
  }

  addChat('player', txt);
  clearInput();

  // Lock input while witness is responding
  S.locked.add('btn-submit');
  document.getElementById('chat-input').disabled = true;

  // Prompt tokens temporarily consume memory budget during the response.
  S.tokenUsage += tokCost;
  const totalNow = S.tokenUsage + (S.systemOverhead || 0);
  if (totalNow > S.peakToken) S.peakToken = totalNow;
  updateBar();

  S.queryTokenUsed += tokCost;
  S.queryCount++;
  updateQCounter();
  ageMemory();
  const decayForgot = decayMemory();
  if (S.phase === 'game' && decayForgot.length) {
    animateForgot(decayForgot, () => { renderCloud(); renderCF(); updateBar(); });
    addChat('sys', 'Memory fades — the oldest clue slips away.');
  }

  const pending = addChatPending();
  const resp = await aiRespondAsync(txt);

  // Track prompt history for game phase
  if (S.phase === 'game') {
    const analysis = analyzePrompt(txt, S.promptHistory);
    S.promptHistory.push({
      text: txt,
      tokensUsed: tokCost,
      memSnapshot: S.memFacts.map(f => f.id),
      response: resp,
      analysis,
    });
  }

  resolveChatPending(pending, resp);
  S.tokenUsage = Math.max(0, S.tokenUsage - tokCost);
  updateBar();

  // Unlock input
  S.locked.delete('btn-submit');
  document.getElementById('chat-input').disabled = false;
  document.getElementById('chat-input').focus();

  if (S.phase === 'tutorial') tutQueryDone();
  if (S.phase === 'game') persistGameState();
  checkDeadEnd();
}

function hasWinEvidence() {
  const mtext = S.memFacts.map(f => f.text.toLowerCase()).join(' ');
  const hasSc = mtext.includes('scarf') || mtext.includes('crane') || mtext.includes('pawn');
  const hasMi = mtext.includes('midnight') || mtext.includes('11 pm') || mtext.includes('jazz');
  return hasSc && hasMi;
}

function canAddAnyFact() {
  const overhead = S.systemOverhead || 0;
  return S.cfFacts.some(f => !f.inMemory && (S.tokenUsage + overhead + f.cost) <= S.tokenLimit);
}

function checkDeadEnd() {
  if (S.phase !== 'game') return;
  if (!canAddAnyFact() && S.memFacts.length === 0) {
    addChat('sys', 'No clues left in memory and no room to add more. The case goes cold.');
    endGame(false);
    return;
  }
  if (!S.deadEndWarned) {
    const remaining = S.queryTokenLimit - S.queryTokenUsed;
    const minPrompt = promptTokens('who is the thief');
    const nearNoQueries = remaining > 0 && remaining <= minPrompt;
    const nearNoMemory = !canAddAnyFact() && !hasWinEvidence();
    if (nearNoQueries || nearNoMemory) {
      addChat('sys', 'Warning: you are one step from a dead end. Consider accusing or summarizing now.');
      S.deadEndWarned = true;
    }
  }
  if (S.eliminatedIds.size >= S.suspects.length) {
    addChat('sys', 'All suspects eliminated. The case goes cold.');
    endGame(false);
    return;
  }
  const outOfQueries = S.queryTokenUsed >= S.queryTokenLimit;
  if (outOfQueries && !canAddAnyFact() && !hasWinEvidence()) {
    addChat('sys', 'No more leads and no evidence left. The case goes cold.');
    endGame(false);
  }
}

// ── Accuse flow ──────────────────────────────────────────
function onAccuseSelect(id) {
  S.selectedAccuseId = id;
  renderAccuseSuspects(id, onAccuseSelect);
  document.getElementById('btn-accuse-ok').disabled = false;
  document.getElementById('accuse-result').textContent = '';
}

function openAccuse() {
  S.selectedAccuseId = null;
  document.getElementById('accuse-modal').classList.add('open');
  const res = document.getElementById('accuse-result');
  if (!hasWinEvidence()) {
    res.className   = 'fail';
    res.textContent = '⚠ Load the key evidence into memory first — the witness must remember it to testify.';
  } else {
    res.className   = '';
    res.textContent = '';
  }
  document.getElementById('btn-accuse-ok').disabled = true;
  renderAccuseSuspects(null, onAccuseSelect);
}

function closeAccuse() {
  document.getElementById('accuse-modal').classList.remove('open');
}

function processAccuse() {
  const id  = S.selectedAccuseId;
  const res = document.getElementById('accuse-result');
  if (!id) { res.className = 'fail'; res.textContent = '◦ Select a suspect first.'; return; }

  const mtext = S.memFacts.map(f => f.text.toLowerCase()).join(' ');
  const hasSc = mtext.includes('scarf') || mtext.includes('crane') || mtext.includes('pawn');
  const hasMi = mtext.includes('midnight') || mtext.includes('11 pm') || mtext.includes('jazz');

  S.accusedId = id;

  if (id === 'victor') {
    if (hasSc && hasMi) {
      res.className   = 'ok';
      res.textContent = '✓ CORRECT! Victor Crane is apprehended!';
      S.caseSolved    = true;
      setTimeout(() => { closeAccuse(); endGame(true); }, 1400);
    } else {
      const missing = [];
      if (!hasSc) missing.push('the red scarf evidence');
      if (!hasMi) missing.push('the midnight timeline');
      res.className   = 'fail';
      res.textContent = `✗ The charge won't stick. Missing from memory: ${missing.join(' and ')}.`;
    }
  } else {
    if (!hasSc || !hasMi) {
      res.className   = 'fail';
      res.textContent = '✗ Not enough evidence yet. Load the key clues into memory first.';
    } else {
      res.className   = 'fail';
      res.textContent = '✗ Wrong suspect. The evidence points elsewhere.';
      setTimeout(() => { closeAccuse(); endGame(false); }, 1600);
    }
  }
}

// ── Eliminate suspect ────────────────────────────────────
function handleEliminate(id) {
  eliminateSuspect(id);
  checkDeadEnd();
}

// ── Universal drop handler ───────────────────────────────
function handleDrop(fid) {
  if (S.phase === 'tutorial') {
    tutDrop(fid);
  } else if (S.phase === 'game') {
    gameDrop(fid);
    checkMemoryPressure();
  }
}

// ── Event wiring ─────────────────────────────────────────
function setupEvents() {
  setupDropZone(handleDrop);

  renderCloud(toggleBubbleSel);
  renderCF(handleDrop);
  renderSuspects(handleEliminate);

  // Landing buttons
  document.getElementById('btn-new-game').addEventListener('click', () => initGame());
  document.getElementById('btn-continue').addEventListener('click', async () => {
    try {
      const saved = await loadCurrentGame();
      if (saved) initGame(saved);
      else initGame();
    } catch { initGame(); }
  });
  document.getElementById('btn-go-tutorial').addEventListener('click', () => initTutorial());

  // Tutorial navigation
  document.getElementById('btn-tut-next').addEventListener('click', advanceTut);
  document.getElementById('btn-skip-tut').addEventListener('click', async () => {
    await setTutorialComplete().catch(() => {});
    initGame();
  });
  document.getElementById('btn-start-game').addEventListener('click', async () => {
    await setTutorialComplete().catch(() => {});
    initGame();
  });

  // Replay / back to landing
  document.getElementById('btn-replay').addEventListener('click', () => showLanding());

  // Submit
  document.getElementById('btn-submit').addEventListener('click', () => {
    if (S.locked.has('btn-submit')) return;
    const v = getInputValue();
    if (v) submitQuery(v);
  });
  document.getElementById('chat-input').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !S.locked.has('btn-submit')) {
      const v = getInputValue();
      if (v) submitQuery(v);
    }
  });

  // Summarize
  document.getElementById('btn-summarize').addEventListener('click', () => {
    if (S.locked.has('btn-summarize')) return;
    if (S.isSummarizing) { exitSumMode(); return; }
    enterSumMode();
  });
  document.getElementById('btn-confirm-merge').addEventListener('click', () => {
    if (S.phase === 'tutorial') S.t5Phase = 'confirm_merge';
    doConfirmMerge();
  });
  document.getElementById('btn-cancel-sum').addEventListener('click', exitSumMode);

  // Accuse
  document.getElementById('btn-accuse').addEventListener('click', openAccuse);
  document.getElementById('btn-accuse-ok').addEventListener('click', processAccuse);
  document.getElementById('btn-accuse-cancel').addEventListener('click', closeAccuse);

  // Tabs
  document.getElementById('tab-evidence').addEventListener('click', () => switchTab('evidence'));
  document.getElementById('tab-suspects').addEventListener('click', () => switchTab('suspects'));
}

// ── Boot ─────────────────────────────────────────────────
async function boot() {
  setupEvents();
  showLanding();
}

boot();

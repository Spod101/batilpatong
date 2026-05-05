import './styles/main.css';
import { S } from './game/state.js';
import { applyPromptOverflow, mergeFacts, ageMemory, analyzePrompt, promptTokens } from './game/tokenEngine.js';
import { aiRespond } from './game/aiWitness.js';

import {
  initTutorial, advanceTut, isTutAllowed,
  handleDrop as tutDrop, onQueryDone as tutQueryDone,
  onMergeDone as tutMergeDone, onSummarizeClicked, onBubbleSelected,
} from './game/tutorial.js';
import { initGame, handleDrop as gameDrop, endGame, eliminateSuspect, persistGameState } from './game/mainCase.js';

import { updateBar }  from './ui/tokenBar.js';
import { renderCloud, animateForgot, setupDropZone } from './ui/memoryCloud.js';
import { renderCF }   from './ui/caseFile.js';
import { addChat, updateQCounter, getInputValue, clearInput } from './ui/chatTerminal.js';
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
  addChat('sys', 'Click two facts in the memory cloud to select them for merging.');

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
  cfm.style.display = S.sumSelected.length === 2 ? 'inline-block' : 'none';
  if (S.sumSelected.length === 2) {
    cfm.disabled = false;
    cfm.classList.remove('locked');
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
  addChat('sys', `Merged → "${result.mergedText}" (${result.newCost}t, saved ${result.saved}t)`);

  if (S.phase === 'tutorial') tutMergeDone(id1, id2);
  if (S.phase === 'game') persistGameState();
}

// ── Query submission ─────────────────────────────────────
function submitQuery(txt) {
  if (!txt.trim()) return;

  const tokCost = promptTokens(txt);
  if (tokCost > S.tokenLimit) {
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

  // Prompt tokens temporarily consume memory budget during the response.
  S.tokenUsage += tokCost;
  if (S.tokenUsage > S.peakToken) S.peakToken = S.tokenUsage;
  updateBar();

  const resp = aiRespond(txt);
  S.queryTokenUsed += tokCost;

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

  S.queryCount++;
  updateQCounter();
  ageMemory();

  setTimeout(() => {
    addChat('ai', resp);
    S.tokenUsage = Math.max(0, S.tokenUsage - tokCost);
    updateBar();
    if (S.phase === 'tutorial') tutQueryDone();
    if (S.phase === 'game') {
      persistGameState();
    }
  }, 580);
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
  document.getElementById('accuse-result').textContent = '';
  document.getElementById('btn-accuse-ok').disabled    = true;
  renderAccuseSuspects(null, onAccuseSelect);
}

function closeAccuse() {
  document.getElementById('accuse-modal').classList.remove('open');
}

function processAccuse() {
  const id  = S.selectedAccuseId;
  const res = document.getElementById('accuse-result');
  if (!id) { res.className = 'fail'; res.textContent = '◦ Select a suspect first.'; return; }

  const mtext  = S.memFacts.map(f => f.text.toLowerCase()).join(' ');
  const hasSc  = mtext.includes('scarf') || mtext.includes('crane') || mtext.includes('pawn');
  const hasMi  = mtext.includes('midnight') || mtext.includes('11 pm') || mtext.includes('jazz');
  const hasCr  = mtext.includes('crash');

  S.accusedId = id;

  if (id === 'victor') {
    if (hasSc && hasMi && hasCr) {
      res.className   = 'ok';
      res.textContent = '✓ CORRECT! Victor Crane is apprehended!';
      S.caseSolved    = true;
      setTimeout(() => { closeAccuse(); endGame(true); }, 1400);
    } else {
      res.className   = 'fail';
      res.textContent = '✗ You lack the evidence to make this charge stick. Add key clues to memory.';
    }
  } else {
    if (!hasSc || !hasMi || !hasCr) {
      res.className   = 'fail';
      res.textContent = '✗ Not enough evidence yet. Investigate further before accusing.';
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
}

// ── Universal drop handler ───────────────────────────────
function handleDrop(fid) {
  if (S.phase === 'tutorial') {
    tutDrop(fid);
  } else if (S.phase === 'game') {
    gameDrop(fid);
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

import './styles/main.css';
import { S } from './game/state.js';
import { applyPromptOverflow, mergeFacts } from './game/tokenEngine.js';
import { aiRespond } from './game/aiWitness.js';

import {
  initTutorial, advanceTut, isTutAllowed,
  handleDrop as tutDrop, onQueryDone as tutQueryDone,
  onMergeDone as tutMergeDone, onSummarizeClicked, onBubbleSelected,
} from './game/tutorial.js';
import { initGame, handleDrop as gameDrop, endGame } from './game/mainCase.js';

import { updateBar }  from './ui/tokenBar.js';
import { renderCloud, animateForgot, setupDropZone } from './ui/memoryCloud.js';
import { renderCF }   from './ui/caseFile.js';
import { addChat, updateQCounter, getInputValue, clearInput } from './ui/chatTerminal.js';
import { tutHint, setTutMsg } from './ui/tutorialPanel.js';
import { isTutorialComplete, setTutorialComplete } from './db/indexdb.js';

// ── PWA service worker ───────────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

// ── Summarize mode ───────────────────────────────────────────
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
}

// ── Query submission ─────────────────────────────────────────
function submitQuery(txt) {
  if (!txt.trim()) return;

  const forgotIds = applyPromptOverflow(txt);
  if (forgotIds.length) {
    animateForgot(forgotIds, () => { renderCloud(); renderCF(); updateBar(); });
  } else {
    renderCloud(); renderCF(); updateBar();
  }

  addChat('player', txt);
  clearInput();

  const resp = aiRespond();
  S.queryCount++;
  updateQCounter();

  setTimeout(() => {
    addChat('ai', resp);
    if (S.phase === 'tutorial') tutQueryDone();
    if (S.phase === 'game') {
      if (S.queryCount >= 3) document.getElementById('btn-accuse').disabled = false;
      if (S.queryCount >= S.maxQueries && !S.caseSolved) {
        setTimeout(() => endGame(false), 1000);
      }
    }
  }, 580);
}

// ── Accuse flow ──────────────────────────────────────────────
function openAccuse() {
  document.getElementById('accuse-modal').classList.add('open');
  document.getElementById('accuse-input').value      = '';
  document.getElementById('accuse-result').textContent = '';
  setTimeout(() => document.getElementById('accuse-input').focus(), 60);
}

function closeAccuse() {
  document.getElementById('accuse-modal').classList.remove('open');
}

function processAccuse() {
  const raw = document.getElementById('accuse-input').value;
  const inp = raw.toLowerCase().trim();
  const res = document.getElementById('accuse-result');

  // Check memory for required evidence
  const mtext  = S.memFacts.map(f => f.text.toLowerCase()).join(' ');
  const hasSc  = mtext.includes('scarf');
  const hasMi  = mtext.includes('midnight');
  const nameOk = inp.includes('red scarf') || inp.includes('scarf burglar') || inp === 'the red scarf burglar';

  if (nameOk || (inp.includes('scarf') && (hasMi || inp.includes('midnight')))) {
    res.className   = 'ok';
    res.textContent = '✓ CORRECT! The Red Scarf Burglar is apprehended!';
    S.caseSolved = true;
    setTimeout(() => { closeAccuse(); endGame(true); }, 1400);
  } else if (!hasSc && !hasMi) {
    res.className   = 'fail';
    res.textContent = '✗ Not enough evidence yet. Add the key clues to memory.';
  } else {
    res.className   = 'fail';
    res.textContent = '✗ Wrong suspect. Keep investigating.';
  }
}

// ── Universal drop handler ───────────────────────────────────
function handleDrop(fid) {
  if (S.phase === 'tutorial') {
    tutDrop(fid);
  } else if (S.phase === 'game') {
    gameDrop(fid);
  }
}

// ── Event wiring ─────────────────────────────────────────────
function setupEvents() {
  // Drop zone
  setupDropZone(handleDrop);

  // Render callbacks
  renderCloud(toggleBubbleSel);
  renderCF(handleDrop);

  // Tutorial navigation
  document.getElementById('btn-tut-next').addEventListener('click', advanceTut);
  document.getElementById('btn-start-game').addEventListener('click', async () => {
    await setTutorialComplete().catch(() => {});
    initGame();
  });

  // Replay
  document.getElementById('btn-replay').addEventListener('click', () => initTutorial());

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
  document.getElementById('accuse-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') processAccuse();
    if (e.key === 'Escape') closeAccuse();
  });
}

// ── Boot ─────────────────────────────────────────────────────
async function boot() {
  setupEvents();
  try {
    const done = await isTutorialComplete();
    if (done) {
      initGame();
    } else {
      initTutorial();
    }
  } catch {
    initTutorial();
  }
}

boot();

import { esc } from './helpers.js';
import { getPlayerName, setPlayerName } from '../db/indexdb.js';

export function showEndScreen({ solved, queryCount, queryTokenUsed, queryTokenLimit, peakToken, tokenLimit,
                                usedSummarize, score, rank, accusedId, promptHistory,
                                difficulty, caseTitle, culpritReveal, suspects }) {
  document.getElementById('screen-game').style.display    = 'none';
  document.getElementById('screen-landing').style.display = 'none';
  const es = document.getElementById('screen-end');
  es.style.display = 'flex';

  // ── Outcome header ────────────────────────────────────
  const tl = document.getElementById('end-title');
  tl.textContent = solved ? '✓ CASE CLOSED' : '✗ COLD CASE';
  tl.className   = solved ? 'solved' : 'unsolved';

  document.getElementById('end-score').textContent = score + ' pts';
  document.getElementById('end-rank').textContent  = rank;
  document.getElementById('s-solved').textContent  = solved ? 'YES' : 'NO';
  document.getElementById('s-queries').textContent = `${queryTokenUsed} / ${queryTokenLimit}t`;
  document.getElementById('s-peak').textContent    = `${peakToken} / ${tokenLimit} tokens`;
  document.getElementById('s-sum').textContent     = usedSummarize ? 'YES (+15 pts)' : 'NO';

  const diffEl = document.getElementById('s-difficulty');
  if (diffEl) diffEl.textContent = difficulty || '—';

  const pct = Math.round((1 - peakToken / tokenLimit) * 100);
  document.getElementById('end-share').textContent =
    solved
      ? `You solved the case using ${queryTokenUsed} interrogation tokens and ${100 - pct}% of your memory budget.`
      : `The case went cold after ${queryTokenUsed} interrogation tokens. Review the evidence next time.`;

  // ── Culprit reveal ────────────────────────────────────
  const crEl = document.getElementById('end-culprit');
  if (crEl && culpritReveal) {
    const accused = accusedId ? (suspects || []).find(s => s.id === accusedId) : null;
    const guilty  = (suspects || []).find(s => s.guilty);
    if (solved) {
      crEl.innerHTML = `
        <div class="cr-label">PERPETRATOR IDENTIFIED</div>
        <div class="cr-name">${esc(culpritReveal.name)}</div>
        <div class="cr-role">${esc(culpritReveal.role)}</div>
        <div class="cr-detail">${esc(culpritReveal.detail)}</div>
      `;
      crEl.className = 'culprit-reveal solved';
    } else {
      crEl.innerHTML = `
        <div class="cr-label">THE REAL PERPETRATOR</div>
        <div class="cr-name">${esc(culpritReveal.name)}</div>
        <div class="cr-role">${esc(culpritReveal.role)}</div>
        <div class="cr-detail">
          ${accused && guilty && accused.id !== guilty.id
            ? `You accused ${esc(accused.name)} — an innocent person. ` : ''}
          ${esc(culpritReveal.detail)}
        </div>
      `;
      crEl.className = 'culprit-reveal unsolved';
    }
  }

  // ── Player name section ───────────────────────────────
  _renderNameSection();

  // ── Prompt history ────────────────────────────────────
  renderPromptHistory(promptHistory || []);
}

function _renderNameSection() {
  const wrap = document.getElementById('player-name-section');
  if (!wrap) return;
  const saved = getPlayerName();
  wrap.innerHTML = `
    <div class="pn-label">Your detective name for the leaderboard:</div>
    <div id="pn-input-row">
      <input id="pn-input" type="text" maxlength="24" placeholder="Anonymous Detective"
             value="${esc(saved || '')}" autocomplete="off" spellcheck="false">
      <button id="btn-pn-save">Save</button>
    </div>
    <div id="pn-saved" style="display:none">✓ Saved</div>
  `;
  document.getElementById('btn-pn-save').addEventListener('click', _saveName);
  document.getElementById('pn-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') _saveName();
  });
}

function _saveName() {
  const input = document.getElementById('pn-input');
  if (!input) return;
  const name = setPlayerName(input.value);
  input.value = name || '';
  const saved = document.getElementById('pn-saved');
  if (saved) {
    saved.textContent = name ? `✓ Saved as: ${name}` : '✓ Cleared';
    saved.style.display = 'block';
    setTimeout(() => { if (saved) saved.style.display = 'none'; }, 2200);
  }
}

export function renderPromptHistory(history) {
  const wrap = document.getElementById('end-prompt-history');
  if (!wrap) return;
  wrap.innerHTML = '';

  if (!history.length) {
    wrap.innerHTML = '<div class="ph-empty">No queries recorded.</div>';
    return;
  }

  const title = document.createElement('div');
  title.className = 'ph-title';
  title.textContent = 'INTERROGATION LOG';
  wrap.appendChild(title);

  history.forEach((entry, i) => {
    const row = document.createElement('div');
    row.className = 'ph-row';
    const eff = entry.analysis;
    const effClass = eff ? (eff.efficient ? 'eff-good' : 'eff-warn') : '';
    row.innerHTML = `
      <div class="ph-query ${effClass}">
        <span class="ph-num">#${i + 1}</span>
        <span class="ph-text">${esc(entry.text)}</span>
        <span class="ph-cost">${entry.tokensUsed}t</span>
      </div>
      ${eff && eff.issues.length ? `
        <div class="ph-issues">
          ${eff.issues.map(is => `<span class="ph-issue">⚠ ${esc(is)}</span>`).join('')}
          ${eff.improved ? `<span class="ph-improved">→ "${esc(eff.improved)}"</span>` : ''}
        </div>
      ` : ''}
    `;
    wrap.appendChild(row);
  });

  const totalTok = history.reduce((s, e) => s + e.tokensUsed, 0);
  const footer = document.createElement('div');
  footer.className = 'ph-footer';
  footer.textContent = `${history.length} queries · ${totalTok} tokens spent on prompts`;
  wrap.appendChild(footer);
}

export function hideEndScreen() {
  document.getElementById('screen-end').style.display = 'none';
}

export function renderLeaderboard(entries) {
  const list = document.getElementById('lb-list');
  list.innerHTML = '';
  if (!entries || entries.length === 0) {
    list.innerHTML = '<div style="font-size:10px;color:#3a2a10;padding:8px 0">No solved cases yet. Be the first!</div>';
    return;
  }
  entries.slice(0, 10).forEach((e, i) => {
    const displayName = e.playerName
      ? esc(e.playerName)
      : (e.sessionToken ? e.sessionToken.substring(0, 8) + '…' : 'anon');
    const diff = (e.difficulty || '').toLowerCase();
    const diffTag = e.difficulty
      ? ` <span class="lb-diff lb-diff-${diff}">${esc(e.difficulty)}</span>`
      : '';
    const row = document.createElement('div');
    row.className = 'sr';
    row.innerHTML = `<span class="sl">#${i + 1} ${displayName}${diffTag}</span><span class="sv">${e.score} pts (${e.queriesUsed}t)</span>`;
    list.appendChild(row);
  });
}

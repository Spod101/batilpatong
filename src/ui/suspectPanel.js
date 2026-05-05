import { S } from '../game/state.js';
import { esc } from './helpers.js';

let _onEliminate = null;

export function renderSuspects(onEliminate) {
  if (onEliminate !== undefined) _onEliminate = onEliminate;
  const list = document.getElementById('suspect-list');
  if (!list) return;
  list.innerHTML = '';
  S.suspects.forEach(susp => {
    const el = document.createElement('div');
    const isElim = S.eliminatedIds.has(susp.id);
    el.className = 'suspect-card' + (isElim ? ' eliminated' : '');
    el.dataset.id = susp.id;
    el.innerHTML = `
      <div class="sc-header">
        <span class="sc-name">${esc(susp.name)}</span>
        <span class="sc-role">${esc(susp.role)}</span>
      </div>
      <div class="sc-desc">${esc(susp.description)}</div>
      <div class="sc-alibi">${esc(susp.alibi)}</div>
      ${!isElim
        ? `<button class="btn-eliminate" data-id="${susp.id}">Eliminate</button>`
        : '<div class="sc-elim-badge">◆ Eliminated</div>'}
    `;
    list.appendChild(el);
  });
  list.querySelectorAll('.btn-eliminate').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      if (_onEliminate) _onEliminate(btn.dataset.id);
    });
  });
}

// Render suspect cards inside the accuse modal
export function renderAccuseSuspects(selectedId, onSelect) {
  const box = document.getElementById('accuse-suspects');
  if (!box) return;
  box.innerHTML = '';
  S.suspects.forEach(susp => {
    const isElim = S.eliminatedIds.has(susp.id);
    const isSel  = susp.id === selectedId;
    const el = document.createElement('div');
    el.className = 'accuse-card' + (isElim ? ' elim' : '') + (isSel ? ' selected' : '');
    el.dataset.id = susp.id;
    el.innerHTML = `
      <span class="ac-name">${esc(susp.name)}</span>
      <span class="ac-role">${esc(susp.role)}</span>
      ${isElim ? '<span class="ac-elim">Eliminated</span>' : ''}
    `;
    if (!isElim) {
      el.addEventListener('click', () => onSelect(susp.id));
    }
    box.appendChild(el);
  });
}

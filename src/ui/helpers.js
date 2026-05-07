import { S } from '../game/state.js';

export function lockAll() {
  ['chat-input', 'btn-submit', 'btn-summarize', 'btn-accuse', 'btn-confirm-merge'].forEach(lockEl);
  document.querySelectorAll('.fact-token').forEach(el => el.classList.add('lf'));
}

export function lockEl(id) {
  S.locked.add(id);
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('locked');
  if (el.tagName === 'BUTTON') el.disabled = true;
}

export function unlockEl(id) {
  S.locked.delete(id);
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('locked');
  if (el.tagName === 'BUTTON') el.disabled = false;
}

export function unlockFact(fid) {
  const el = document.getElementById(`fact-${fid}`);
  if (el) el.classList.remove('lf');
  S.locked.delete(`fact-${fid}`);
}

export function hlEl(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('tutorial-highlight');
}

export function clearHL() {
  document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
}

export function esc(s) {
  if (!s) return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

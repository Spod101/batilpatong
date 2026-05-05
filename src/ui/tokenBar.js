import { S } from '../game/state.js';

export function updateBar() {
  const total = S.tokenUsage + (S.systemOverhead || 0);
  const pct  = S.tokenLimit > 0 ? (total / S.tokenLimit) * 100 : 0;
  const fill = document.getElementById('token-bar-fill');
  fill.style.width = pct + '%';
  fill.classList.remove('warn', 'danger');
  if (pct > 85)      fill.classList.add('danger');
  else if (pct > 60) fill.classList.add('warn');
  document.getElementById('tbLabel').textContent = `${total} / ${S.tokenLimit}`;
}

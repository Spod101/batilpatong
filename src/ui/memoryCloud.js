import { S } from '../game/state.js';
import { esc } from './helpers.js';

let _onBubbleClick = null;
let _onDrop        = null;

export function renderCloud(onBubbleClick) {
  if (onBubbleClick !== undefined) _onBubbleClick = onBubbleClick;
  const cl = document.getElementById('memory-cloud');
  cl.querySelectorAll('.memory-bubble').forEach(b => b.remove());
  document.getElementById('mcPlaceholder').style.display = S.memFacts.length ? 'none' : 'block';
  S.memFacts.forEach(f => {
    const b = document.createElement('div');
    b.className = 'memory-bubble' + (f.merged ? ' merged' : '');
    b.dataset.id = f.id;
    b.innerHTML = `<span class="bt">${esc(f.text)}</span><span class="bc">${f.cost}t</span>`;
    b.addEventListener('click', () => {
      if (_onBubbleClick) _onBubbleClick(f.id);
    });
    cl.appendChild(b);
  });
}

export function animateForgot(ids, onDone) {
  if (!ids.length) { if (onDone) onDone(); return; }
  ids.forEach(id => {
    const b = document.querySelector(`.memory-bubble[data-id="${id}"]`);
    if (b) b.classList.add('forgetting');
  });
  setTimeout(() => { if (onDone) onDone(); }, 460);
}

export function setupDropZone(onDrop) {
  _onDrop = onDrop;
  const cl = document.getElementById('memory-cloud');
  cl.addEventListener('dragover', e => { e.preventDefault(); cl.classList.add('dz-over'); });
  cl.addEventListener('dragleave', () => cl.classList.remove('dz-over'));
  cl.addEventListener('drop', e => {
    e.preventDefault();
    cl.classList.remove('dz-over');
    const fid = e.dataTransfer.getData('text/plain') || S.draggingId;
    if (fid && _onDrop) _onDrop(fid);
  });
  cl.addEventListener('click', e => {
    if (e.target.closest('.memory-bubble')) return;
    if (S.selectedFact && _onDrop) _onDrop(S.selectedFact);
  });
}

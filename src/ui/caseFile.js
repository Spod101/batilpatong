import { S } from '../game/state.js';

let _onDrop = null;

const GROUP_ORDER  = ['identity', 'scene', 'timeline'];
const GROUP_LABELS = { identity: 'IDENTITY — who', scene: 'SCENE — what', timeline: 'TIMELINE — when' };

export function renderCF(onDrop) {
  if (onDrop !== undefined) _onDrop = onDrop;
  const cf = document.getElementById('case-file');
  cf.querySelectorAll('.fact-token, .cf-group-label').forEach(el => el.remove());

  const hasGroups = S.cfFacts.some(f => f.group);
  const facts = hasGroups
    ? [...S.cfFacts].sort((a, b) => {
        const ai = GROUP_ORDER.indexOf(a.group || '');
        const bi = GROUP_ORDER.indexOf(b.group || '');
        return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
      })
    : S.cfFacts;

  let lastGroup = null;
  facts.forEach(f => {
    if (hasGroups && f.group && f.group !== lastGroup) {
      const label = document.createElement('div');
      label.className = 'cf-group-label';
      label.textContent = GROUP_LABELS[f.group] || f.group.toUpperCase();
      cf.appendChild(label);
      lastGroup = f.group;
    }
    appendFactToken(cf, f);
  });
}

function appendFactToken(cf, f) {
  const el = document.createElement('div');
  el.className   = 'fact-token' + (f.inMemory ? ' in-memory' : '');
  el.id          = `fact-${f.id}`;
  el.dataset.fid = f.id;
  el.draggable   = !f.inMemory;
  el.textContent = f.text;

  el.addEventListener('dragstart', e => {
    if (f.inMemory || el.classList.contains('lf') || el.classList.contains('locked')) {
      e.preventDefault(); return;
    }
    S.draggingId = f.id;
    e.dataTransfer.setData('text/plain', f.id);
    e.dataTransfer.effectAllowed = 'move';
  });
  el.addEventListener('dragend', () => { S.draggingId = null; });

  el.addEventListener('click', () => {
    if (f.inMemory || el.classList.contains('lf') || el.classList.contains('locked')) return;
    if (S.selectedFact === f.id) {
      S.selectedFact = null;
      el.classList.remove('sel-fact');
    } else {
      document.querySelectorAll('.fact-token.sel-fact').forEach(x => x.classList.remove('sel-fact'));
      S.selectedFact = f.id;
      el.classList.add('sel-fact');
    }
  });

  setupTouch(el, f.id);
  cf.appendChild(el);
}

function setupTouch(el, fid) {
  const ghost = document.getElementById('drag-ghost');
  let active  = false;

  el.addEventListener('touchstart', e => {
    if (el.classList.contains('in-memory') || el.classList.contains('lf') || el.classList.contains('locked')) return;
    active = true;
    const t = e.touches[0];
    ghost.textContent   = el.textContent;
    ghost.style.display = 'block';
    ghost.style.left    = (t.clientX - 70) + 'px';
    ghost.style.top     = (t.clientY - 22) + 'px';
  }, { passive: true });

  el.addEventListener('touchmove', e => {
    if (!active) return;
    e.preventDefault(); // prevent page scroll during drag
    const t = e.touches[0];
    ghost.style.left = (t.clientX - 70) + 'px';
    ghost.style.top  = (t.clientY - 22) + 'px';
  }, { passive: false });

  el.addEventListener('touchend', e => {
    if (!active) return;
    active = false;
    ghost.style.display = 'none';
    const t      = e.changedTouches[0];
    const target = document.elementFromPoint(t.clientX, t.clientY);
    const cl     = document.getElementById('memory-cloud');
    if ((cl === target || cl.contains(target)) && _onDrop) _onDrop(fid);
  });
}

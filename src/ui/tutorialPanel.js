export function setTutMsg(title, msg, showNext = false, nextLabel = 'Next →') {
  document.getElementById('tut-title').textContent = title;
  document.getElementById('tut-msg').textContent   = msg;
  document.getElementById('tut-hint').textContent  = '';
  const ok = document.getElementById('tut-ok');
  ok.style.display = 'none';
  ok.textContent   = '';
  const nb = document.getElementById('btn-tut-next');
  nb.style.display = showNext ? 'block' : 'none';
  nb.textContent   = nextLabel;
}

export function tutOk(msg, showNext = false, nextLabel = 'Next →') {
  const ok = document.getElementById('tut-ok');
  ok.textContent   = '✓ ' + msg;
  ok.style.display = 'block';
  const nb = document.getElementById('btn-tut-next');
  nb.style.display = showNext ? 'block' : 'none';
  nb.textContent   = nextLabel;
}

export function tutHint(msg) {
  document.getElementById('tut-hint').textContent = msg ? '⚠ ' + msg : '';
}

export function showTutPanel() {
  document.getElementById('tut-panel').classList.remove('hidden');
  document.body.classList.add('tut-active');
}

export function hideTutPanel() {
  document.getElementById('tut-panel').classList.add('hidden');
  document.body.classList.remove('tut-active');
}

export function updateStepNum(n) {
  document.getElementById('tut-step-num').textContent = n;
}

export function showStartWrap() {
  document.getElementById('tut-start-wrap').style.display = 'flex';
  document.getElementById('btn-tut-next').style.display   = 'none';
}

export function hideStartWrap() {
  document.getElementById('tut-start-wrap').style.display = 'none';
}

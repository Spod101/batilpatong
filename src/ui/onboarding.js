
export function renderOnboarding(caseData, { onStart, onBack }) {
  const screen = document.getElementById('screen-onboarding');
  const flap = document.getElementById('dossier-flap');
  const btn = document.getElementById('btn-open-investigation');
  const btnBack = document.getElementById('btn-onboarding-back');
  
  // Fill Folder Cover
  document.getElementById('dossier-case-id').textContent = `CASE FILE #${caseData.id.toUpperCase()}`;
  document.getElementById('dossier-title').textContent = caseData.title;
  const badge = document.getElementById('dossier-difficulty-badge');
  badge.textContent = caseData.difficulty;
  badge.className = caseData.difficulty.toLowerCase();

  // Fill Doc 1: Report
  document.getElementById('doc-title').textContent = caseData.title;
  document.getElementById('doc-difficulty').textContent = caseData.difficulty;
  document.getElementById('doc-tokens').textContent = `${caseData.tokenLimit} tokens`;
  document.getElementById('doc-description').textContent = caseData.description;
  document.getElementById('doc-witness-quote').textContent = `"${caseData.openingLine}"`;

  // Fill Doc 2: Suspects
  const suspectList = document.getElementById('dossier-suspect-list');
  suspectList.innerHTML = caseData.suspects.map(s => `
    <div class="dossier-suspect-card">
      <div class="dsc-photo">👤</div>
      <div class="dsc-info">
        <div class="dsc-top">
          <div class="dsc-name">${s.name}</div>
          <div class="dsc-role">${s.role}</div>
        </div>
        <div class="dsc-desc">${s.description}</div>
        <div class="dsc-alibi">${s.alibi}</div>
        <div class="dsc-status">UNDER INVESTIGATION</div>
      </div>
    </div>
  `).join('');

  // Fill Doc 3: Evidence
  const evidenceList = document.getElementById('dossier-evidence-list');
  evidenceList.innerHTML = caseData.facts.map(f => {
    // Redact facts whose ID is in lossyKeywords
    const shouldRedact = caseData.lossyKeywords?.includes(f.id);
    let displayText = f.text;
    
    if (shouldRedact && caseData.lossyKeywords) {
      caseData.lossyKeywords.forEach(kw => {
        const re = new RegExp(`\\b${kw}\\b`, 'gi');
        displayText = displayText.replace(re, `<span class="redacted-block">${'█'.repeat(kw.length)}</span>`);
      });
    }
    
    return `
      <div class="dossier-fact">
        <span class="df-tag">${f.group}</span>
        <span class="df-text">${displayText}</span>
      </div>
    `;
  }).join('');

  // Fill Doc 4: Rules
  const rulesList = document.getElementById('dossier-rules-list');
  rulesList.innerHTML = `
    <li>Memory Budget: <b>${caseData.tokenLimit} tokens</b></li>
    <li>Cost per Clue: <b>${caseData.factCost} tokens</b></li>
    <li>Memory Decays every: <b>${caseData.decayEveryQueries} queries</b></li>
    <li>Elimination Bonus: <b>+${caseData.eliminationBonus} tokens</b></li>
  `;
  
  const warning = document.getElementById('rules-warning');
  if (caseData.difficulty === 'HARD') {
    warning.style.color = '#b71c1c';
    warning.innerHTML = '<b>URGENT:</b> Details may be lost to rapid summarization. Preserve what matters.';
  } else {
    warning.style.color = '#c62828';
    warning.textContent = 'Details may be lost to summarization. Preserve what matters.';
  }

  // Show screen and reset animations
  screen.style.display = 'flex';
  screen.scrollTop = 0;
  flap.classList.remove('open');
  btn.classList.remove('show');
  
  const docs = document.querySelectorAll('.dossier-doc');
  docs.forEach(d => d.classList.remove('show'));

  // Trigger animations
  setTimeout(() => {
    flap.classList.add('open');
    docs.forEach(d => d.classList.add('show'));
    btn.classList.add('show');
  }, 400);

  // Handle close
  btn.onclick = () => {
    // Animate closing
    flap.classList.remove('open');
    btn.classList.remove('show');
    docs.forEach(d => d.classList.remove('show'));
    
    setTimeout(() => {
      screen.style.display = 'none';
      onStart();
    }, 600);
  };

  btnBack.onclick = () => {
    screen.style.display = 'none';
    onBack();
  };
}

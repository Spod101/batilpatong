
export function renderOnboarding(data, options) {
  const screen = document.getElementById('screen-onboarding');
  const inner = document.getElementById('onboarding-inner');
  const folder = document.getElementById('dossier-folder');
  const flap = document.getElementById('dossier-flap');
  const btn = document.getElementById('btn-open-investigation');
  const btnBack = document.getElementById('btn-onboarding-back');
  const docsContainer = document.getElementById('dossier-docs');

  // Reset state
  screen.style.display = 'flex';
  screen.scrollTop = 0;
  flap.classList.remove('open');
  btn.classList.remove('show');
  folder.className = ''; 

  // Reset folder animation
  inner.style.animation = 'none';
  void inner.offsetWidth; // force reflow
  inner.style.animation = '';
  
  if (options.type === 'tutorial') {
    renderTutorialContent({ folder, docsContainer, btn, btnBack, flap, options });
  } else {
    renderCaseContent({ caseData: data, folder, docsContainer, btn, btnBack, flap, options });
  }

  const docs = document.querySelectorAll('.dossier-doc');
  docs.forEach(d => d.classList.remove('show'));

  // Trigger animations after a short delay to ensure state is reset
  setTimeout(() => {
    flap.classList.add('open');
    docs.forEach(d => d.classList.add('show'));
    btn.classList.add('show');
  }, 450);

  // Handle Close (Start)
  btn.onclick = () => {
    flap.classList.remove('open');
    btn.classList.remove('show');
    docs.forEach(d => d.classList.remove('show'));
    setTimeout(() => {
      screen.style.display = 'none';
      options.onStart();
    }, 800);
  };

  // Handle Back
  btnBack.onclick = () => {
    flap.classList.remove('open');
    btn.classList.remove('show');
    docs.forEach(d => d.classList.remove('show'));
    setTimeout(() => {
      screen.style.display = 'none';
      options.onBack();
    }, 800);
  };
}

function renderCaseContent({ caseData, folder, docsContainer, btn, btnBack, flap, options }) {
  folder.classList.add('case-folder');
  btn.textContent = '▶ OPEN INVESTIGATION';
  btnBack.style.display = 'block';

  // Folder Cover
  document.getElementById('dossier-case-id').textContent = `CASE FILE #${caseData.id.toUpperCase()}`;
  document.getElementById('dossier-title').textContent = caseData.title;
  const badge = document.getElementById('dossier-difficulty-badge');
  badge.textContent = caseData.difficulty;
  badge.className = caseData.difficulty.toLowerCase();

  // Documents
  docsContainer.innerHTML = `
    <!-- Doc 1: Incident Report -->
    <div class="dossier-doc doc-report">
      <h3>INCIDENT REPORT</h3>
      <div class="doc-field"><span class="df-l">SUBJECT:</span> <span>${caseData.title}</span></div>
      <div class="doc-field"><span class="df-l">CLASSIFICATION:</span> <span>${caseData.difficulty}</span></div>
      <div class="doc-field"><span class="df-l">MEMORY BUDGET:</span> <span>${caseData.tokenLimit} tokens</span></div>
      <hr>
      <p>${caseData.description}</p>
      <div id="doc-witness-quote">"${caseData.openingLine}"</div>
    </div>

    <!-- Doc 2: Suspect Roster -->
    <div class="dossier-doc doc-suspects">
      <h3>SUSPECT ROSTER</h3>
      <div class="dossier-suspect-list">
        ${caseData.suspects.map(s => `
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
        `).join('')}
      </div>
    </div>

    <!-- Doc 3: Evidence Inventory -->
    <div class="dossier-doc doc-evidence">
      <h3>EVIDENCE INVENTORY</h3>
      <div class="evidence-stamp">PARTIAL DISCLOSURE — FURTHER EVIDENCE IN FIELD</div>
      <div class="dossier-evidence-list">
        ${caseData.facts.map(f => {
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
        }).join('')}
      </div>
    </div>

    <!-- Doc 4: Investigator Briefing -->
    <div class="dossier-doc doc-rules">
      <h3>BRIEFING</h3>
      <ul>
        <li>Memory Budget: <b>${caseData.tokenLimit} tokens</b></li>
        <li>Cost per Clue: <b>${caseData.factCost} tokens</b></li>
        <li>Memory Decays every: <b>${caseData.decayEveryQueries} queries</b></li>
        <li>Elimination Bonus: <b>+${caseData.eliminationBonus} tokens</b></li>
      </ul>
      <p class="rules-warning" style="color: ${caseData.difficulty === 'HARD' ? '#b71c1c' : '#c62828'}">
        ${caseData.difficulty === 'HARD' 
          ? '<b>URGENT:</b> Details will be lost to rapid summarization. Preserve what matters.' 
          : 'Details may be lost to summarization. Preserve what matters.'}
      </p>
    </div>
  `;
}

function renderTutorialContent({ folder, docsContainer, btn, btnBack, flap, options }) {
  folder.classList.add('training');
  btn.textContent = '▶ BEGIN TRAINING';
  btnBack.style.display = 'block';

  // Folder Cover
  document.getElementById('dossier-case-id').textContent = 'DETECTIVE ACADEMY';
  document.getElementById('dossier-title').textContent = 'HOW TO INTERROGATE';
  const badge = document.getElementById('dossier-difficulty-badge');
  badge.textContent = 'TRAINING';
  badge.className = 'training';

  // Documents
  docsContainer.innerHTML = `
    <!-- Doc 1: Briefing Letter -->
    <div class="dossier-doc doc-briefing">
      <h3>CHIEF'S BRIEFING</h3>
      <p>Welcome to the Academy, recruit. You're about to face your first interrogation simulation.</p>
      <blockquote>
        "You will be working alongside an AI witness — a system with imperfect recall. It can only hold so much information at once. Feed it the right clues, ask the right questions, and it will name the culprit. Overwhelm it, and it forgets."
      </blockquote>
      <div class="pull-out"><b>The Witness forgets.</b> Memory is finite. Older facts are dropped when new ones are added.</div>
      <div class="pull-out"><b>You choose what it remembers.</b> Drag facts from the Case File into its memory.</div>
      <div class="pull-out"><b>Ask questions to get closer.</b> The witness responds based only on what it currently holds.</div>
    </div>

    <!-- Doc 2: Training Case Summary -->
    <div class="dossier-doc doc-report">
      <h3>TRAINING SUMMARY</h3>
      <div class="doc-field"><span class="df-l">CASE:</span> <span>Training Exercise — The Midnight Theft</span></div>
      <div class="doc-field"><span class="df-l">SCENE:</span> <span>A locked room. One suspect. Three clues.</span></div>
      <div class="doc-field"><span class="df-l">OBJECTIVE:</span> <span>Identify the thief using witness memory.</span></div>
      <div class="doc-field"><span class="df-l">STATUS:</span> <span style="color: #1565c0; font-weight: 900;">SIMULATION — NO REAL CRIME</span></div>
      <hr>
      <p>In this exercise, you will learn to manage the "Memory Cloud." Pay attention to the token bar — it is your lifeline.</p>
    </div>

    <!-- Doc 3: Memory Mechanics Reference Card -->
    <div class="dossier-doc">
      <h3>QUICK REFERENCE CARD</h3>
      <div class="ref-card">
        <div class="ref-item"><span class="ref-tag">FEED</span> <span class="ref-text">Drag facts from Case File → Memory Cloud</span></div>
        <div class="ref-item"><span class="ref-tag">ASK</span> <span class="ref-text">Type questions to the witness in the chat</span></div>
        <div class="ref-item"><span class="ref-tag">LIMIT</span> <span class="ref-text">Memory fills up. Old facts are dropped first.</span></div>
        <div class="ref-item"><span class="ref-tag">SUMMARIZE</span> <span class="ref-text">Merge two facts into one to save space.</span></div>
        <div class="ref-item"><span class="ref-tag">SOLVE</span> <span class="ref-text">Witness names the culprit with the right clues.</span></div>
        <div class="ref-item"><span class="ref-tag">ACCUSE</span> <span class="ref-text">Lock in your answer. One chance.</span></div>
      </div>
    </div>

    <!-- Doc 4: Dos and Don'ts -->
    <div class="dossier-doc">
      <h3>FIELD TIPS</h3>
      <div class="sticky-container">
        <div class="sticky-note do">
          <h4>DO</h4>
          <ul>
            <li>Load identifying clues</li>
            <li>Ask focused questions</li>
            <li>Summarize early</li>
            <li>Eliminate suspects</li>
          </ul>
        </div>
        <div class="sticky-note dont">
          <h4>DON'T</h4>
          <ul>
            <li>Dump all facts at once</li>
            <li>Ask vague questions</li>
            <li>Ignore the token bar</li>
          </ul>
        </div>
      </div>
    </div>
  `;
}

import { S, MERGE_TABLE } from './state.js';

export function memText() {
  return S.memFacts.map(f => f.text.toLowerCase()).join(' ');
}

export function promptTokens(txt) {
  return txt.trim().split(/\s+/).filter(Boolean).length * 2;
}

// Returns { added: bool, forgotIds: string[] }
export function addFact(factId) {
  const fact = S.cfFacts.find(f => f.id === factId);
  if (!fact || fact.inMemory) return { added: false, forgotIds: [] };

  const forgotIds = [];
  while (S.tokenUsage + fact.cost > S.tokenLimit && S.memFacts.length > 0) {
    const oldest = S.memFacts.shift();
    S.tokenUsage -= oldest.cost;
    const cf = S.cfFacts.find(f => f.id === oldest.id);
    if (cf) cf.inMemory = false;
    forgotIds.push(oldest.id);
  }
  if (S.tokenUsage + fact.cost > S.tokenLimit) return { added: false, forgotIds };

  fact.inMemory = true;
  S.memFacts.push({ id: fact.id, text: fact.text, cost: fact.cost, merged: false, age: 0 });
  S.tokenUsage += fact.cost;
  if (S.tokenUsage > S.peakToken) S.peakToken = S.tokenUsage;

  return { added: true, forgotIds };
}

// Shed memory to fit a prompt; returns list of forgotten ids
export function applyPromptOverflow(txt) {
  const pt = promptTokens(txt);
  const forgotIds = [];
  while (S.tokenUsage + pt > S.tokenLimit && S.memFacts.length > 0) {
    const oldest = S.memFacts.shift();
    S.tokenUsage -= oldest.cost;
    const cf = S.cfFacts.find(f => f.id === oldest.id);
    if (cf) cf.inMemory = false;
    forgotIds.push(oldest.id);
  }
  return forgotIds;
}

// Increment age on all memory facts — call after each query
export function ageMemory() {
  S.memFacts.forEach(f => { f.age = (f.age || 0) + 1; });
}

// Returns { mergedId, mergedText, saved, newCost } or null if invalid
export function mergeFacts(id1, id2) {
  const f1 = S.memFacts.find(f => f.id === id1);
  const f2 = S.memFacts.find(f => f.id === id2);
  if (!f1 || !f2) return null;

  const mtext = MERGE_TABLE[`${id1}+${id2}`] ||
    (f1.text.substring(0, 18) + '… & ' + f2.text.substring(0, 18) + '…').substring(0, 44);
  const oldCost = f1.cost + f2.cost;
  const newCost = 60;

  S.memFacts = S.memFacts.filter(f => f.id !== id1 && f.id !== id2);
  S.tokenUsage -= oldCost;

  [id1, id2].forEach(id => {
    const cf = S.cfFacts.find(f => f.id === id);
    if (cf) cf.inMemory = true;
  });

  const mid = `merged_${id1}_${id2}_${Date.now()}`;
  S.memFacts.push({ id: mid, text: mtext, cost: newCost, merged: true, mergedFrom: [id1, id2], age: 0 });
  S.tokenUsage += newCost;
  S.usedSummarize = true;

  return { mergedId: mid, mergedText: mtext, saved: oldCost - newCost, newCost };
}

export function calcScore() {
  let sc = 0;
  if (S.caseSolved) sc += 50;
  if (S.queryTokenLimit > 0) {
    const ratio = Math.min(1, S.queryTokenUsed / S.queryTokenLimit);
    sc += Math.floor((1 - ratio) * 50);
  }
  sc += Math.floor((1 - S.peakToken / S.tokenLimit) * 20);
  if (S.usedSummarize) sc += 15;
  if (S.eliminatedIds && S.eliminatedIds.size > 0) sc += Math.min(S.eliminatedIds.size * 3, 12);
  const rank =
    sc >= 90 ? '★★★ MASTER DETECTIVE ★★★' :
    sc >= 70 ? '★★ SENIOR DETECTIVE ★★' :
    sc >= 50 ? '★ DETECTIVE ★' :
               '◦ CADET ◦';
  return { score: sc, rank };
}

// ── Prompt analysis ──────────────────────────────────────
export function analyzePrompt(prompt, prevPrompts) {
  const words = prompt.trim().split(/\s+/).filter(Boolean);
  const tokCost = words.length * 2;
  const issues = [];
  let improved = null;

  if (words.length > 9) {
    issues.push('Verbose — longer prompts burn more tokens');
    const core = words.filter(w => w.length > 3).slice(0, 5);
    improved = (core.length >= 2 ? core.join(' ') : words.slice(0, 5).join(' ')) + '?';
  }

  if (/^(is|was|did|does|were|has|have|can|could|would)\s/i.test(prompt)) {
    issues.push('Closed question — open-ended gets richer recall');
    if (!improved) improved = 'What do you recall about ' + words.slice(1, 4).join(' ') + '?';
  }

  if (words.length < 3) {
    issues.push('Too brief — give the witness a specific angle');
  }

  if (/\b(anything|everything|tell me|describe|explain|what happened)\b/i.test(prompt)) {
    issues.push('Vague — target a specific detail or suspect');
    if (!improved) improved = 'What specific detail do you recall about the thief?';
  }

  if (prevPrompts.length > 0) {
    const similar = prevPrompts.filter(p => {
      const pw = p.text.toLowerCase().split(/\s+/);
      const cw = prompt.toLowerCase().split(/\s+/);
      const overlap = cw.filter(w => w.length > 3 && pw.includes(w));
      return overlap.length >= 2;
    });
    if (similar.length > 0) {
      issues.push('Redundant — overlaps with an earlier query');
    }
  }

  const efficient = issues.length === 0 && words.length >= 3 && words.length <= 9;
  return { issues, improved, efficient, tokCost };
}

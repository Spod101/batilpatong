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
  S.memFacts.push({ id: fact.id, text: fact.text, cost: fact.cost, merged: false });
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
  S.memFacts.push({ id: mid, text: mtext, cost: newCost, merged: true, mergedFrom: [id1, id2] });
  S.tokenUsage += newCost;
  S.usedSummarize = true;

  return { mergedId: mid, mergedText: mtext, saved: oldCost - newCost, newCost };
}

export function calcScore() {
  let sc = 0;
  if (S.caseSolved) sc += 50;
  sc += Math.max(0, S.maxQueries - S.queryCount) * 5;
  sc += Math.floor((1 - S.peakToken / S.tokenLimit) * 20);
  if (S.usedSummarize) sc += 15;
  const rank =
    sc >= 85 ? '★★★ MASTER DETECTIVE ★★★' :
    sc >= 65 ? '★★ SENIOR DETECTIVE ★★' :
    sc >= 45 ? '★ DETECTIVE ★' :
               '◦ CADET ◦';
  return { score: sc, rank };
}

export function showEndScreen({ solved, queryCount, maxQueries, peakToken, tokenLimit, usedSummarize, score, rank }) {
  document.getElementById('screen-game').style.display = 'none';
  const es = document.getElementById('screen-end');
  es.style.display = 'flex';

  const tl = document.getElementById('end-title');
  tl.textContent = solved ? '✓ CASE CLOSED' : '✗ COLD CASE';
  tl.className   = solved ? 'solved' : 'unsolved';

  document.getElementById('end-score').textContent  = score + ' pts';
  document.getElementById('end-rank').textContent   = rank;
  document.getElementById('s-solved').textContent   = solved ? 'YES' : 'NO';
  document.getElementById('s-queries').textContent  = `${queryCount} / ${maxQueries}`;
  document.getElementById('s-peak').textContent     = `${peakToken} / ${tokenLimit} tokens`;
  document.getElementById('s-sum').textContent      = usedSummarize ? 'YES (+15 pts)' : 'NO';

  const pct = Math.round((1 - peakToken / tokenLimit) * 100);
  document.getElementById('end-share').textContent =
    solved
      ? `You solved the case in ${queryCount} ${queryCount === 1 ? 'query' : 'queries'} using ${100 - pct}% of your token budget.`
      : `The case went cold after ${queryCount} ${queryCount === 1 ? 'query' : 'queries'}. Review the evidence next time.`;
}

export function hideEndScreen() {
  document.getElementById('screen-end').style.display = 'none';
}

export function renderLeaderboard(entries) {
  const list = document.getElementById('lb-list');
  list.innerHTML = '';
  if (!entries || entries.length === 0) {
    list.innerHTML = '<div style="font-size:10px;color:#3a2a10;padding:8px 0">No solved cases yet. Be the first!</div>';
    return;
  }
  entries.slice(0, 10).forEach((e, i) => {
    const tok  = e.sessionToken ? e.sessionToken.substring(0, 8) : 'anon';
    const row  = document.createElement('div');
    row.className   = 'sr';
    row.innerHTML   = `<span class="sl">#${i + 1} ${tok}…</span><span class="sv">${e.score} pts (${e.queriesUsed}q)</span>`;
    list.appendChild(row);
  });
}

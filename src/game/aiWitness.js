import { S } from './state.js';
import { memText } from './tokenEngine.js';

// ── Tutorial witness ─────────────────────────────────────
function tutorialRespond() {
  const t       = memText();
  const hasGlove  = t.includes('glove');
  const hasMid    = t.includes('midnight');
  const hasWin    = t.includes('window');
  const hasMerged = S.memFacts.some(f => f.merged);

  if (hasMerged && hasGlove)
    return 'I see it clearly now... a gloved hand in a midnight break-in through an open window... The Midnight Glove — that is the thief!';
  if (hasGlove && hasMid)
    return "I see it now... a gloved hand... striking at midnight... The Midnight Glove! That's the thief!";
  if (hasMid && hasWin && !hasGlove)
    return "It was midnight... a window left open... but I cannot recall the hand. The name... it's lost in shadow.";
  if (hasGlove && !hasMid)
    return "I remember... a glove on someone's hand... but the hour escapes me. I cannot yet name the face.";
  if (hasMid && !hasGlove && !hasWin)
    return 'It was midnight... but the figure is cloaked in shadow. I need more to go on.';
  if (hasWin && !hasGlove && !hasMid)
    return 'A window... left open... an entry point perhaps. But who? And when? I need more.';
  return 'The fog... I see nothing. Show me something to remember.';
}

export function aiRespond(queryText) {
  if (S.phase === 'tutorial') return tutorialRespond();
  if (S.currentCase?.witnessRespond) return S.currentCase.witnessRespond(queryText);
  return 'My memory is dark. Give me something from the case file — a clue, a name, a time.';
}

const WITNESS_SYSTEM = `You are a civilian witness being questioned by a detective about a crime you were present for. You are cooperative but visibly shaken — the experience left you rattled, your hands tremble slightly, and you occasionally lose your train of thought mid-sentence.

You speak carefully and formally. You want to help, but your memory has fragmented from the shock of what you witnessed.

YOUR MEMORY IS UNRELIABLE. You can ONLY recall the specific details listed below — nothing more, nothing less.

=== WHAT YOU CURRENTLY REMEMBER ===
{FACTS}
====================================

STRICT RULES:
1. If asked about something NOT in your memory, say you cannot recall — "that detail escapes me," "I'm afraid that part is a blur," "I wish I could help you there, Detective, but I simply cannot place it."
2. Do NOT invent, guess, or infer anything beyond the listed facts above.
3. If your memory is empty, you are completely fogged — you cannot recall any useful detail at all.
4. Stay in character at all times. You are a shaken civilian, not an AI assistant.
5. Keep responses to 2–3 sentences maximum. Do not ramble or over-explain.
6. Address the detective with quiet respect. Never volunteer information beyond what was asked.`;

// Async version — calls Haiku directly from browser, falls back to rule-based on error
// WARNING: exposes VITE_ANTHROPIC_API_KEY in the browser bundle. Use a server proxy for production.
export async function aiRespondAsync(queryText) {
  if (S.phase === 'tutorial') return tutorialRespond();

  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) return aiRespond(queryText);

  try {
    const factsBlock = S.memFacts.length
      ? S.memFacts.map(f => `• ${f.text}`).join('\n')
      : '(empty — you cannot recall anything specific about that evening)';

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 130,
        system: WITNESS_SYSTEM.replace('{FACTS}', factsBlock),
        messages: [{ role: 'user', content: queryText }],
      }),
    });

    const data = await res.json();
    const text = data.content?.[0]?.text;
    if (text) return text;
  } catch (_) {
    // fall through to rule-based
  }

  return aiRespond(queryText);
}

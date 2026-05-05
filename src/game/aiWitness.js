import { S } from './state.js';
import { memText } from './tokenEngine.js';
import { SUSPECTS } from './suspects.js';

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

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

// ── Suspect-specific responses ───────────────────────────
function respondAboutSuspect(susp, hasSc, hasMi, hasGu, hasNk, hasCr) {
  if (susp.id === 'victor') {
    if (hasSc && hasMi && hasCr)
      return 'Victor Crane... the red scarf... midnight... the crash before the alarm. His alibi collapses. I am certain — it was Crane.';
    if (hasSc && hasMi)
      return 'The scarf and the midnight timeline point to Crane, but the crash detail is missing. I need the final link.';
    if (hasSc)
      return "Victor Crane always wore that scarf. Unmistakable. But when did he strike? I need the timeline.";
    if (hasMi)
      return "Victor Crane's alibi was the jazz club. It closes at eleven. If this happened at midnight — he lied to us.";
    return "Victor Crane... a pawn shop... a past in the trade. I know the name, but the fog hides the connection. Give me more evidence.";
  }
  if (susp.id === 'nadia') {
    if (hasSc)
      return "Nadia Voss would not be caught in a red scarf. Too distinctive for someone who values control and anonymity.";
    if (hasMi)
      return "Nadia claims she was home at midnight. Alone. Convenient, but I cannot place her near the gallery.";
    return "Nadia Voss knew the vault layout... the schedules... but I see nothing tying her to the crime itself. Knowledge alone is not guilt.";
  }
  if (susp.id === 'dominic') {
    if (hasGu)
      return "Dominic Vale's guard fell asleep — careless, yes. But Dominic himself was elsewhere on the property. The failure is his, not the act.";
    if (hasSc)
      return "Dominic in a red scarf? Never. He wears a uniform. That detail simply does not fit him.";
    return "Dominic Vale... the security man whose man slept. Negligent, perhaps. But I do not see him as the thief.";
  }
  if (susp.id === 'iris') {
    if (hasMi)
      return "Iris Kwan left at 10:30 PM. Her driver's log confirms the pickup. She was gone before midnight — the timeline clears her completely.";
    if (hasSc)
      return "Iris in a red scarf? Unlikely. She favors designer labels, not utility wear. And she had a verified early exit from the gala.";
    return "Iris Kwan was at the gala, yes. But she left early — 10:30 PM, documented. I cannot place her near midnight.";
  }
  if (susp.id === 'rex') {
    if (hasNk)
      return "Rex Holden would certainly want that necklace. But the auction records in Caldwell City... I cannot ignore them. He was out of the area.";
    if (hasSc)
      return "Rex Holden is a broker, not a field man. He deals — he does not steal directly. A red scarf thief breaking in is not his style.";
    return "Rex Holden profits from pieces like this, true. But the hotel records for Caldwell City... they place him elsewhere that night.";
  }
  return "I recall something about that name... but the details are lost in the fog. Share more evidence.";
}

// ── Main game witness ────────────────────────────────────
function gameRespond(queryText) {
  const t  = memText();
  const q  = (queryText || '').toLowerCase();

  const hasSc = t.includes('scarf') || t.includes('pawn') || t.includes('crane') || t.includes('ashford');
  const hasMi = t.includes('midnight') || t.includes('11 pm') || t.includes('jazz');
  const hasGu = t.includes('guard') || t.includes('petrov') || t.includes('asleep');
  const hasNk = t.includes('necklace') || t.includes('diamond');
  const hasWi = t.includes('window') || t.includes('east');
  const hasCr = t.includes('crash');

  // Check if player is asking about a specific suspect
  const namedSusp = SUSPECTS.find(s => {
    const parts = s.name.toLowerCase().split(' ');
    return parts.some(p => q.includes(p)) || q.includes(s.role.toLowerCase());
  });

  if (namedSusp) return respondAboutSuspect(namedSusp, hasSc, hasMi, hasGu, hasNk, hasCr);

  // General memory-based response
  if (hasSc && hasMi && hasCr) return pick([
    "A figure in a red scarf... past midnight... the crash right before the alarm. Victor Crane had no alibi. I am certain it was him.",
    "Red scarf at midnight, crash at 11:58. The Blue Note shut at eleven. Only one man wore that scarf — Victor Crane.",
    "The scarf, the hour, the crash. It all aligns on one name. Victor Crane. I see it clearly now.",
  ]);
  if (hasSc && hasMi) return pick([
    "The scarf and the hour point to someone, but I need the final trigger — the crash detail or another anchor.",
    "Red scarf at midnight, but something is missing. A final clue would lock the name in place.",
  ]);
  if (hasSc && (t.includes('pawn') || t.includes('crane') || t.includes('ashford'))) return pick([
    "The red scarf... and the fabric near Crane's shop... the same pattern. The same man.",
    "Crane's pawn shop on Ashford, red fabric on the fence... and a red scarf at the scene. This points one way.",
  ]);
  if (hasSc) return pick([
    "I remember a red scarf... distinctive... but who wore it? And when did they strike?",
    "The red scarf stays with me. Memorable. But the timing — I need the hour.",
    "Someone in a red scarf. I see the image but cannot place it in time.",
  ]);
  if (hasMi) return pick([
    "Midnight... yes. But the figure is in shadow. Who was there at that hour?",
    "It happened at midnight. The jazz club closes at eleven. One alibi falls apart — whose?",
    "The clock struck midnight. Beyond that... nothing but fog.",
  ]);
  if (hasGu) return pick([
    "The guard was asleep... someone slipped past unnoticed. But who took that opportunity?",
    "Petrov at his post, fast asleep. An opportunity taken. But by whom?",
  ]);
  if (hasWi) return pick([
    "The east window... unlocked from within. Someone with inside knowledge, or inside access.",
    "That window did not open itself. Someone who knew the building opened it ahead of time.",
  ]);
  if (hasCr) return pick([
    "That crash before the alarm... two minutes of chaos. A diversion, I think. Deliberate.",
    "Someone caused that crash to cover their movement. Entry, or exit?",
  ]);
  if (hasNk) return pick([
    "The necklace... beautiful and stolen. Worth two million. Who wanted it badly enough?",
    "Two million in diamonds, taken from a locked case. This was no amateur.",
  ]);
  return pick([
    "My memory is dark. I see nothing. Give me something to hold on to.",
    "The fog... I cannot help you like this. Share the case files with me.",
    "There is only darkness here. What do you want me to remember?",
  ]);
}

export function aiRespond(queryText) {
  if (S.phase === 'tutorial') return tutorialRespond();
  return gameRespond(queryText);
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
  if (!apiKey) return gameRespond(queryText);

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

  return gameRespond(queryText);
}

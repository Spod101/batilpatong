import { S } from './state.js';
import { memText } from './tokenEngine.js';

function tutorialRespond() {
  const t = memText();
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

const GRESP = {
  both: [
    "I see it... a figure wrapped in a red scarf, moving at midnight. The Red Scarf Burglar — that's who took the necklace!",
    'Yes! A red scarf... midnight... it has to be the Red Scarf Burglar. I am certain.',
    'The image is clear: red scarf, midnight hour. The Red Scarf Burglar — no question.',
  ],
  scarf: [
    'A red scarf... distinctive, memorable... but the timing slips away. When did they strike?',
    "I recall a red scarf clearly. But the night's details are murky — I need more.",
    'The scarf stands out in my memory... but I cannot place the hour. Something is missing.',
  ],
  midnight: [
    'It happened at midnight, I am certain. But the figure is shadowed — who were they?',
    'Midnight... yes. But the face, the clothing... all shadow. Give me more.',
    'The clock struck midnight. Beyond that... nothing but fog.',
  ],
  guard: [
    'The guard was asleep... someone slipped past unnoticed. But who?',
    'I see the sleeping guard... an opportunity taken. But by whom?',
  ],
  crash: [
    'A crash before the alarm... deliberate, perhaps — a diversion. But by whom?',
    'The sound of breaking glass, then silence, then the alarm. Who made that crash?',
  ],
  necklace: [
    'The blue diamond necklace... it glitters in my memory. But who took it?',
    'I see the necklace, cold and blue. Someone reached for it in the dark. Who?',
  ],
  nothing: [
    'The memory is dark... I see nothing. Give me something to hold onto.',
    'I cannot help you. My mind is empty. Share a clue with me.',
    'There is only darkness here. What do you want me to remember?',
  ],
};

function gameRespond() {
  const t  = memText();
  const qi = S.queryCount % 3;
  const hasSc = t.includes('scarf');
  const hasMi = t.includes('midnight');

  if (hasSc && hasMi)                               return GRESP.both[qi % GRESP.both.length];
  if (hasSc)                                        return GRESP.scarf[qi % GRESP.scarf.length];
  if (hasMi)                                        return GRESP.midnight[qi % GRESP.midnight.length];
  if (t.includes('guard') || t.includes('security')) return GRESP.guard[qi % GRESP.guard.length];
  if (t.includes('crash'))                          return GRESP.crash[qi % GRESP.crash.length];
  if (t.includes('necklace'))                       return GRESP.necklace[qi % GRESP.necklace.length];
  return GRESP.nothing[qi % GRESP.nothing.length];
}

export function aiRespond() {
  if (S.phase === 'tutorial') return tutorialRespond();
  return gameRespond();
}

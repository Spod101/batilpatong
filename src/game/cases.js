import { S } from './state.js';

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ── EASY: The Missing Heirloom ──────────────────────────────
export const EASY_CASE = {
  id: 'easy',
  difficulty: 'EASY',
  title: 'THE MISSING HEIRLOOM',
  description: 'A gold watch vanishes from a locked boutique. Three suspects, simple clues.',
  tokenLimit: 190,
  factCost: 35,
  systemOverhead: 20,
  decayEveryQueries: 3,
  summarizeLossChance: 0.10,
  queryTokenLimit: 120,
  eliminationBonus: 25,
  suspectCount: 3,
  winGroups: [
    { keywords: ['coat', 'green', 'clara', 'receipt'], label: 'suspect identification (green coat)' },
    { keywords: ['key', 'cabinet', 'staff', 'master'], label: 'access evidence (key)' },
  ],
  lossyKeywords: ['coat', 'green', 'key', 'cabinet', 'footage', 'marcus', 'clara'],
  guiltyId: 'clara',
  openingLine: "Detective... someone took the watch right under my nose. A locked cabinet, a trusted staff... I need you to help me recall who I saw. Share the evidence with me.",
  culpritReveal: {
    name: 'Clara Dumont',
    role: 'Shop Manager',
    detail: "Clara had master key access and was the only staff member present during the footage blackout at noon. Her green coat was spotted near the cabinet twice — and Marcus had already signed out an hour before the theft.",
  },
  suspects: [
    { id: 'clara',  name: 'Clara Dumont', role: 'Shop Manager',    description: 'Has worked at the boutique for 8 years. Has master key access and was last seen near the cabinet before closing.', alibi: '"I was doing inventory in the back room. The cabinet was fine when I left, I swear."', guilty: true  },
    { id: 'marcus', name: 'Marcus Webb',  role: 'Sales Clerk',     description: 'New employee with unpaid debts. Knows the shop layout but lacks key access to the heirloom display.',             alibi: '"I signed out at 11 AM — an hour before this happened. Check the security log."',           guilty: false },
    { id: 'sandra', name: 'Sandra Park', role: 'Security Guard',  description: 'On duty the day of the theft. The security footage went dark for 20 minutes during her patrol window.',             alibi: '"I was on patrol the whole afternoon. I never went near that cabinet."',                   guilty: false },
  ],
  facts: [
    { id: 'coat',       text: 'A person in a green coat was seen near the display cabinet at noon.',                        group: 'identity' },
    { id: 'key',        text: 'Only staff with master keys can unlock the heirloom cabinet.',                               group: 'access'   },
    { id: 'heirloom',   text: 'A gold pocket watch worth $30,000 has gone missing from the locked display.',                group: 'scene'    },
    { id: 'receipt',    text: 'Clara was spotted standing near the cabinet just before closing time.',                      group: 'identity' },
    { id: 'marcus_out', text: 'Security log confirms Marcus signed out at 11 AM — an hour before the theft.',              group: 'alibi'    },
    { id: 'footage',    text: 'Security footage cut out between 12:00 and 12:20 PM — precisely when the theft occurred.',  group: 'scene'    },
  ],
  mergeTable: {
    'coat+receipt':    'Green coat near cabinet — spotted twice',
    'receipt+coat':    'Green coat near cabinet — spotted twice',
    'coat+key':        'Key-holder in green coat, cabinet breach',
    'key+coat':        'Key-holder in green coat, cabinet breach',
    'key+heirloom':    'Locked cabinet opened with staff key',
    'heirloom+key':    'Locked cabinet opened with staff key',
    'footage+coat':    'Green coat during footage blackout',
    'coat+footage':    'Green coat during footage blackout',
    'marcus_out+key':  'Marcus gone; Clara held the key',
    'key+marcus_out':  'Marcus gone; Clara held the key',
    'footage+heirloom':'Watch stolen during 20-min blackout',
    'heirloom+footage':'Watch stolen during 20-min blackout',
  },
  witnessRespond(queryText) {
    const t = S.memFacts.map(f => f.text.toLowerCase()).join(' ');
    const q = (queryText || '').toLowerCase();
    const hasCoat    = t.includes('coat') || t.includes('green');
    const hasKey     = t.includes('key') || t.includes('cabinet') || t.includes('staff') || t.includes('master');
    const hasFootage = t.includes('footage') || t.includes('12:00') || t.includes('blackout') || t.includes('cut out');
    const hasMarcus  = t.includes('marcus') || t.includes('11 am') || t.includes('signed out');

    const named = EASY_CASE.suspects.find(s => {
      const parts = s.name.toLowerCase().split(' ');
      return parts.some(p => q.includes(p)) || q.includes(s.role.toLowerCase());
    });

    if (named) {
      if (named.id === 'clara') {
        if (hasCoat && hasKey) return 'Clara... green coat near the cabinet... and she had the only key at that hour. I see it now. It was Clara Dumont.';
        if (hasCoat) return 'Clara in that green coat — I remember seeing her near the display. But who had key access? That detail is slipping.';
        if (hasKey) return 'Clara had master key access and was the only one left. But what did the witness see her wearing? I need that detail.';
        return 'Clara Dumont... trusted, experienced. But something nags at me. I need more evidence to be sure.';
      }
      if (named.id === 'marcus') {
        if (hasMarcus) return 'Marcus signed out at 11 AM — the log is right there. An hour before the theft. He simply could not have done it.';
        return 'Marcus Webb... debts, yes. But where was he exactly? The timeline matters here.';
      }
      if (named.id === 'sandra') {
        if (hasFootage) return "Sandra was patrolling, but that footage gap during her window... I can't quite clear her. Still, I don't see her at the cabinet.";
        return 'Sandra was on duty. On patrol. But patrol takes her away from the display — I cannot place her at the scene.';
      }
    }

    if (hasCoat && hasKey) return pick([
      'A green coat near the cabinet... and only one person had key access that afternoon. This is becoming clear.',
      'The coat, the key, the opportunity. It all converges on one name. I am almost certain now.',
    ]);
    if (hasCoat) return pick([
      'Someone in a green coat near the cabinet. Distinctive. But who had the key? I need that connection.',
      'The green coat... I remember it clearly. But access — who could open that cabinet?',
    ]);
    if (hasKey) return pick([
      'Only staff can open that cabinet. At noon — who was still in the shop? What did they look like?',
      'A key. That narrows the field. But I need to know who was seen near the display that day.',
    ]);
    if (hasFootage) return pick([
      'Twenty minutes of darkness. Someone knew exactly when to move. Who was in the building then?',
      'The footage gap was not random. Someone planned around it. Who had both access and motive?',
    ]);
    return pick([
      'The heirloom... gone. But my memory is still clouded. Share the case evidence with me.',
      'A theft in daylight, from a locked display. I need the clues to see who did this.',
      'Show me what you found — a coat, a key, a face. I need something concrete.',
    ]);
  },
};

// ── MEDIUM: The Theft of the Blue Diamond Necklace ─────────
export const MEDIUM_CASE = {
  id: 'medium',
  difficulty: 'MEDIUM',
  title: 'THE THEFT OF THE BLUE DIAMOND NECKLACE',
  description: 'A $2M necklace stolen from a locked gallery at midnight. Five suspects.',
  tokenLimit: 170,
  factCost: 40,
  systemOverhead: 30,
  decayEveryQueries: 2,
  summarizeLossChance: 0.25,
  queryTokenLimit: 90,
  eliminationBonus: 20,
  suspectCount: 5,
  winGroups: [
    { keywords: ['scarf', 'crane', 'pawn', 'ashford'], label: 'suspect identification (red scarf)' },
    { keywords: ['midnight', '11 pm', 'jazz'], label: 'timeline (midnight)' },
  ],
  lossyKeywords: ['scarf', 'midnight', 'crash', 'guard', 'necklace', 'window', 'pawn', 'pawn shop', 'ashford'],
  guiltyId: 'victor',
  openingLine: "Detective... I remember so little. A theft — a blue diamond necklace. You must help me recall. Share the case files with me.",
  culpritReveal: {
    name: 'Victor Crane',
    role: 'Ex-Jewel Thief',
    detail: "Victor Crane's alibi fell apart: the Blue Note Jazz Club closes at 11 PM — he had no alibi past midnight. The red scarf, snagged fabric near his shop, and the midnight timeline sealed his guilt.",
  },
  suspects: [
    { id: 'victor',  name: 'Victor Crane',  role: 'Ex-Jewel Thief',      description: "Runs a pawn shop on Ashford St. Known for his signature red scarf and gem-trade contacts.",                 alibi: '"At the Blue Note Jazz Club all evening. The bartender knows me."',                  guilty: true  },
    { id: 'nadia',   name: 'Nadia Voss',    role: 'Museum Curator',      description: "Former head of acquisitions. Knew the vault layout and security rotation firsthand.",                      alibi: '"Home alone all evening. No witnesses — but I have nothing to hide."',              guilty: false },
    { id: 'dominic', name: 'Dominic Vale',  role: 'Security Contractor', description: "Hired to oversee gallery security the night of the theft. His guard fell asleep at his post.",           alibi: '"Making rounds in the east wing all night. My guard\'s failure shames me."',         guilty: false },
    { id: 'iris',    name: 'Iris Kwan',     role: 'Socialite',           description: "Attended the gala where the necklace was displayed. Left before the rest of the guests.",                 alibi: '"Car service picked me up at 10:30 PM. Gone long before midnight."',                guilty: false },
    { id: 'rex',     name: 'Rex Holden',    role: 'Antiques Dealer',     description: "Known to broker high-value stolen pieces. Has buyers for gems like the Blue Diamond.",                    alibi: '"At the Sotheby\'s auction in Caldwell City. Hotel records confirm my stay."',      guilty: false },
  ],
  facts: [
    { id: 'scarf',    text: "A witness saw the thief wearing a red scarf.",           group: 'identity' },
    { id: 'pawnshop', text: "Red fabric snagged near Crane's pawn shop on Ashford.", group: 'identity' },
    { id: 'guard',    text: "Guard Petrov was asleep at his post.",                   group: 'scene'    },
    { id: 'crash',    text: "A crash heard at 11:58 PM before the alarm.",            group: 'scene'    },
    { id: 'necklace', text: "Blue Diamond Necklace ($2M) taken from locked display.", group: 'scene'    },
    { id: 'window',   text: "East window found unlocked from the inside.",            group: 'scene'    },
    { id: 'midnight', text: "Theft at midnight — jazz club closed at 11 PM.",         group: 'timeline' },
    { id: 'valet',    text: "A valet saw a blue sedan idling outside near closing.",  group: 'timeline' },
    { id: 'lights',   text: "Gallery lights flickered shortly before the alarm.",     group: 'timeline' },
  ],
  mergeTable: {
    'scarf+midnight':    'Red scarf thief at midnight',
    'midnight+scarf':    'Red scarf thief at midnight',
    'scarf+pawnshop':    "Red scarf linked to Crane's shop",
    'pawnshop+scarf':    "Red scarf linked to Crane's shop",
    'scarf+guard':       'Scarf figure slipped past sleeping guard',
    'guard+scarf':       'Scarf figure slipped past sleeping guard',
    'midnight+guard':    'Guard asleep at midnight',
    'guard+midnight':    'Guard asleep at midnight',
    'midnight+pawnshop': "Crane's shop, midnight timeline",
    'pawnshop+midnight': "Crane's shop, midnight timeline",
    'crash+midnight':    'Crash at 11:58 PM before theft',
    'midnight+crash':    'Crash at 11:58 PM before theft',
    'necklace+crash':    'Crash preceded necklace theft',
    'crash+necklace':    'Crash preceded necklace theft',
    'window+guard':      'Unlocked window, sleeping guard',
    'guard+window':      'Unlocked window, sleeping guard',
    'scarf+necklace':    'Red scarf thief took the necklace',
    'necklace+scarf':    'Red scarf thief took the necklace',
    'pawnshop+necklace': "Necklace linked to Crane's shop",
    'necklace+pawnshop': "Necklace linked to Crane's shop",
  },
  witnessRespond(queryText) {
    const t = S.memFacts.map(f => f.text.toLowerCase()).join(' ');
    const q = (queryText || '').toLowerCase();
    const hasSc = t.includes('scarf') || t.includes('pawn') || t.includes('crane') || t.includes('ashford');
    const hasMi = t.includes('midnight') || t.includes('11 pm') || t.includes('jazz');
    const hasGu = t.includes('guard') || t.includes('petrov') || t.includes('asleep');
    const hasNk = t.includes('necklace') || t.includes('diamond');
    const hasWi = t.includes('window') || t.includes('east');
    const hasCr = t.includes('crash');

    const named = MEDIUM_CASE.suspects.find(s => {
      const parts = s.name.toLowerCase().split(' ');
      return parts.some(p => q.includes(p)) || q.includes(s.role.toLowerCase());
    });

    if (named) {
      if (named.id === 'victor') {
        if (hasSc && hasMi && hasCr) return 'Victor Crane... the red scarf... midnight... the crash before the alarm. His alibi collapses. I am certain — it was Crane.';
        if (hasSc && hasMi) return 'The scarf and the hour point to Crane, but I need the final trigger — the crash detail.';
        if (hasSc) return "Victor Crane always wore that scarf. Unmistakable. But when did he strike? I need the timeline.";
        if (hasMi) return "Victor Crane's alibi was the jazz club. It closes at eleven. If this happened at midnight — he lied to us.";
        return "Victor Crane... a pawn shop... a past in the trade. I know the name, but the fog hides the connection.";
      }
      if (named.id === 'nadia') {
        if (hasSc) return "Nadia Voss would not be caught in a red scarf. Too distinctive for someone who values control.";
        if (hasMi) return "Nadia claims she was home at midnight. Alone. Convenient, but I cannot place her near the gallery.";
        return "Nadia Voss knew the vault layout... the schedules... but I see nothing tying her to the crime itself.";
      }
      if (named.id === 'dominic') {
        if (hasGu) return "Dominic Vale's guard fell asleep — careless, yes. But Dominic himself was elsewhere on the property.";
        if (hasSc) return "Dominic in a red scarf? Never. He wears a uniform. That detail simply does not fit him.";
        return "Dominic Vale... the security man whose man slept. Negligent, perhaps. But I do not see him as the thief.";
      }
      if (named.id === 'iris') {
        if (hasMi) return "Iris Kwan left at 10:30 PM. Her driver's log confirms the pickup. She was gone before midnight.";
        if (hasSc) return "Iris in a red scarf? Unlikely. She favors designer labels. And she had a verified early exit.";
        return "Iris Kwan was at the gala, yes. But she left early — 10:30 PM, documented.";
      }
      if (named.id === 'rex') {
        if (hasNk) return "Rex Holden would certainly want that necklace. But the auction records in Caldwell City place him elsewhere.";
        if (hasSc) return "Rex Holden is a broker, not a field man. A red scarf thief breaking in is not his style.";
        return "Rex Holden profits from pieces like this. But the hotel records for Caldwell City place him out of town.";
      }
      return "I recall something about that name... but the details are lost. Share more evidence.";
    }

    if (hasSc && hasMi && hasCr) return pick([
      "A figure in a red scarf... past midnight... the crash right before the alarm. Victor Crane had no alibi. I am certain it was him.",
      "Red scarf at midnight, crash at 11:58. The Blue Note shut at eleven. Only one man wore that scarf — Victor Crane.",
    ]);
    if (hasSc && hasMi) return pick([
      "The scarf and the hour point to someone, but I need the final trigger — the crash detail.",
      "Red scarf at midnight, but something is missing. A final clue would lock the name in place.",
    ]);
    if (hasSc) return pick([
      "A red scarf... distinctive, hard to forget. But when did they strike? I need the hour.",
      "Someone in a red scarf — the image is sharp. But where were they, and when?",
    ]);
    if (hasMi) return pick([
      "Midnight... the jazz club closed at eleven. Someone's alibi just broke. But who was there?",
      "It happened after midnight. A narrow window. I need to know who took it.",
    ]);
    if (hasGu) return pick([
      "The guard was asleep. Someone slipped through unnoticed. But through where?",
      "Petrov at his post, fast asleep. That explains the entry. But what did the thief look like?",
    ]);
    if (hasWi) return pick([
      "The east window, unlocked from inside. Someone knew the building. But when — and who?",
      "That window did not open itself. Who had inside knowledge?",
    ]);
    if (hasCr) return pick([
      "That crash at 11:58 — deliberate, a distraction. For what, exactly?",
      "Someone caused that crash to cover their movement. Who was near the gallery?",
    ]);
    if (hasNk) return pick([
      "Two million in diamonds, taken from a locked display. This took planning.",
      "The necklace... beautiful and gone. A professional job. Who had the means?",
    ]);
    return pick([
      "My memory is dark. Give me something from the case file — a clue, a name, a time.",
      "I cannot help you without evidence to work from. Load a clue and ask again.",
      "There is only fog here. What do you want me to remember?",
    ]);
  },
};

// ── HARD: The Vanishing Maestro ─────────────────────────────
export const HARD_CASE = {
  id: 'hard',
  difficulty: 'HARD',
  title: 'THE VANISHING MAESTRO',
  description: 'A celebrated conductor is poisoned in his locked estate. Seven suspects, tighter memory, faster decay.',
  tokenLimit: 150,
  factCost: 45,
  systemOverhead: 35,
  decayEveryQueries: 1,
  summarizeLossChance: 0.35,
  queryTokenLimit: 70,
  eliminationBonus: 15,
  suspectCount: 7,
  winGroups: [
    { keywords: ['flask', 'e.v.', 'initials', 'eva'], label: 'physical evidence (flask)' },
    { keywords: ['poison', 'alkaloid', 'nightshade', 'herb', 'garden'], label: 'method evidence (poison source)' },
  ],
  lossyKeywords: ['flask', 'poison', 'nightshade', 'alkaloid', 'garden', 'will', 'heir', 'ticket', 'geneva', 'eva'],
  guiltyId: 'eva',
  openingLine: "Detective... the maestro is gone and I can barely hold the memories together. Something poisonous... someone close to him. Help me recall. Share the evidence.",
  culpritReveal: {
    name: 'Eva Voss',
    role: 'Personal Assistant',
    detail: "Eva Voss stood to inherit everything under the new will, tended a garden containing deadly nightshade, and her initialed flask was found beside the body. A train ticket to Geneva — booked for the next morning — revealed her intent to flee.",
  },
  suspects: [
    { id: 'eva',       name: 'Eva Voss',          role: 'Personal Assistant',   description: "The maestro's trusted assistant for 11 years. Named sole heir in the new will. Tended his private herb garden.", alibi: '"I was preparing his evening tea as I always did. I was the one who found him."',         guilty: true  },
    { id: 'alexei',   name: 'Alexei Borkov',      role: 'Rival Conductor',      description: "Public feud with the maestro over a prestigious residency. Known for his volatile temper and grudges.",            alibi: '"I was conducting in Vienna that evening. The concert hall will confirm it."',            guilty: false },
    { id: 'helena',   name: 'Helena Strauss',     role: 'Widow',                description: "The maestro's wife of 30 years. Was cut out of the new will entirely and threatened legal action publicly.",       alibi: '"At my sister\'s house in the country. She will vouch for me."',                         guilty: false },
    { id: 'friedrich',name: 'Friedrich Kohl',     role: 'Business Manager',     description: "Manages the estate finances. Would lose his advisory contract under the new will.",                                alibi: '"In a board meeting until midnight. Seven witnesses can confirm."',                       guilty: false },
    { id: 'lena',     name: 'Lena Braun',         role: 'Sous Chef',            description: "Prepared all meals. Had access to the kitchen and pantry. No obvious motive.",                                    alibi: '"Cleaning the kitchen after dinner service. The head chef saw me all evening."',          guilty: false },
    { id: 'wilhelm',  name: 'Dr. Wilhelm Faber',  role: 'Family Physician',     description: "The maestro's doctor for 20 years. Prescribed all medications and knew every health vulnerability.",              alibi: '"Emergency call across town. Hospital records confirm the callout time."',                 guilty: false },
    { id: 'otto',     name: 'Otto Kranz',          role: 'Estate Groundskeeper', description: "Maintains the gardens and grounds. Has access to all outbuildings, including the private herb garden.",           alibi: '"Locking up the greenhouse at dusk. My signature is in the estate log."',                 guilty: false },
  ],
  facts: [
    { id: 'poison',       text: "The maestro was poisoned — a rare alkaloid found in the toxicology report.",                              group: 'method'   },
    { id: 'will',         text: "A new will was signed three days before the death, naming Eva Voss as sole heir.",                        group: 'motive'   },
    { id: 'flask',        text: "A silver hip flask with initials 'E.V.' was found beside the body.",                                      group: 'evidence' },
    { id: 'garden',       text: "Eva Voss tended a private herb garden containing deadly nightshade.",                                     group: 'method'   },
    { id: 'ticket',       text: "A train ticket to Geneva was found in Eva's coat pocket, dated the morning after the death.",            group: 'flight'   },
    { id: 'alexei_alibi', text: "Concert hall records confirm Alexei Borkov was performing in Vienna that evening.",                       group: 'alibi'    },
    { id: 'feud',         text: "Witnesses heard Alexei and the maestro in a bitter argument at the conservatory three weeks prior.",      group: 'motive'   },
    { id: 'will_cut',     text: "Helena Strauss was removed from the will entirely — she threatened legal action when she found out.",     group: 'motive'   },
    { id: 'tea',          text: "Eva prepared the maestro's evening tea every night — the last person to handle his drink.",              group: 'access'   },
    { id: 'bruise',       text: "The maestro had a fresh bruise on his wrist, consistent with a physical struggle shortly before death.", group: 'scene'    },
    { id: 'locked',       text: "The estate was locked from the inside. Only residents and staff held keys.",                              group: 'scene'    },
  ],
  mergeTable: {
    'flask+garden':      "Eva's flask and nightshade — her poison, her mark",
    'garden+flask':      "Eva's flask and nightshade — her poison, her mark",
    'flask+tea':         "Eva's flask near body; she brewed the last tea",
    'tea+flask':         "Eva's flask near body; she brewed the last tea",
    'poison+garden':     "Nightshade alkaloid sourced from Eva's garden",
    'garden+poison':     "Nightshade alkaloid sourced from Eva's garden",
    'will+ticket':       "Eva inherited, then booked flight to flee",
    'ticket+will':       "Eva inherited, then booked flight to flee",
    'poison+tea':        "Poison slipped into the evening tea Eva prepared",
    'tea+poison':        "Poison slipped into the evening tea Eva prepared",
    'flask+poison':      "Poisoned flask — Eva's initials seal it",
    'poison+flask':      "Poisoned flask — Eva's initials seal it",
    'will+garden':       "Heir with access to deadly nightshade",
    'garden+will':       "Heir with deadly nightshade access",
    'bruise+flask':      "Struggle, then poisoning — Eva's flask at scene",
    'flask+bruise':      "Struggle, then poisoning — Eva's flask at scene",
    'alexei_alibi+feud': "Feud existed, but Borkov was in Vienna — cleared",
    'feud+alexei_alibi': "Feud existed, but Borkov was in Vienna — cleared",
    'will_cut+locked':   "Helena had motive but estate was locked to outsiders",
    'locked+will_cut':   "Helena had motive but estate was locked to outsiders",
  },
  witnessRespond(queryText) {
    const t = S.memFacts.map(f => f.text.toLowerCase()).join(' ');
    const q = (queryText || '').toLowerCase();
    const hasFlask  = t.includes('flask') || t.includes('e.v.') || t.includes('initials');
    const hasPoison = t.includes('poison') || t.includes('alkaloid') || t.includes('nightshade') || t.includes('herb');
    const hasGarden = t.includes('garden') || t.includes('nightshade');
    const hasWill   = t.includes('will') || t.includes('heir') || t.includes('inherit');
    const hasTicket = t.includes('ticket') || t.includes('geneva');
    const hasTea    = t.includes('tea');
    const hasBruise = t.includes('bruise') || t.includes('struggle');
    const hasAlexei = t.includes('vienna') || t.includes('concert') || t.includes('borkov');

    const named = HARD_CASE.suspects.find(s => {
      const parts = s.name.toLowerCase().split(' ');
      return parts.some(p => q.includes(p)) || q.includes(s.role.toLowerCase());
    });

    if (named) {
      if (named.id === 'eva') {
        if (hasFlask && hasPoison) return "Eva Voss... her flask at the scene... the nightshade from her own garden... and she prepared his last drink. It was Eva. I am certain.";
        if (hasFlask && hasWill) return "Eva's flask and the new will naming her heir... the motive is clear. But how did she do it? The method is still missing.";
        if (hasFlask) return "That flask with the initials E.V. — Eva Voss. Found beside the body. But what was in it, and where did it come from?";
        if (hasPoison) return "The alkaloid... rare, found in nightshade. Eva tended that garden. She had the means. But what is the direct link?";
        if (hasWill) return "Eva stood to inherit everything. A powerful motive. But motive alone does not name a killer. What was found at the scene?";
        if (hasTea) return "Eva prepared his tea every evening. The last hands on his drink. But what did the toxicology find?";
        return "Eva Voss... trusted assistant... eleven years. But trust can curdle. I need something concrete to place this on her.";
      }
      if (named.id === 'alexei') {
        if (hasAlexei) return "Alexei Borkov was in Vienna — the concert hall confirmed it. The feud was real, but he was not here.";
        return "Alexei Borkov... a rival, a temper. But rivals shout — they rarely poison from a distance.";
      }
      if (named.id === 'helena') {
        if (t.includes('locked')) return "Helena was cut from the will, yes. Furious. But the estate was locked from inside — she had no key after the separation.";
        if (hasWill) return "Helena losing the inheritance... devastating. She threatened action. But threats are not poison.";
        return "Helena Strauss... betrayed. But I need something placing her in the estate that night.";
      }
      if (named.id === 'lena') {
        return "Lena Braun prepared the meals, yes. But no motive surfaces, and the head chef confirmed she was cleaning up all evening.";
      }
      if (named.id === 'wilhelm') {
        return "Dr. Faber was on an emergency call — the hospital has records. A physician who poisons his own patient would be professionally suicidal.";
      }
      if (named.id === 'friedrich') {
        return "Friedrich Kohl had financial reasons to oppose the new will. But seven board witnesses account for his entire evening.";
      }
      if (named.id === 'otto') {
        return "Otto Kranz keeps the grounds. Logged at the greenhouse at dusk. But he knew where the nightshade grew...";
      }
    }

    if (hasFlask && hasPoison) return pick([
      "The flask with E.V.'s initials, and the rare alkaloid from a plant in her own garden. Eva Voss is the only answer.",
      "Nightshade alkaloid... Eva's garden... her flask at the scene. The picture is complete.",
    ]);
    if (hasFlask) return pick([
      "E.V. — Eva Voss. That flask should not be near the body. But where did the poison originate?",
      "The initialed flask is damning. But I need the method — what was the poison, and where did it come from?",
    ]);
    if (hasPoison) return pick([
      "A rare alkaloid. That takes knowledge — or a very specific garden. Who in this estate could extract it quietly?",
      "Alkaloid poisoning takes preparation. Who had the knowledge and access to do this without detection?",
    ]);
    if (hasGarden) return pick([
      "Nightshade in that private garden... Eva tended it. No one else went near it. That is significant.",
      "Deadly nightshade. Eva's garden. The source of the alkaloid is becoming clear.",
    ]);
    if (hasWill && hasTicket) return pick([
      "Heir to everything, with a ticket to Geneva the next morning. Eva Voss was ready to disappear.",
      "The will, the ticket... Eva planned this. She just needed the right moment.",
    ]);
    if (hasWill) return pick([
      "A new will — three days before death. Someone benefited greatly. Who had the means?",
      "The timing of that will is chilling. Who benefits, and who had access to harm him?",
    ]);
    if (hasTea) return pick([
      "She prepared his tea every night. Ritual access. If something was slipped in... who would suspect the assistant?",
      "The evening tea... Eva's hands on it last. I need to know what the doctors found.",
    ]);
    if (hasBruise) return pick([
      "A bruise from a struggle... someone was close to him that night. Who had reason to be in that room?",
      "He fought back. The bruise tells me someone was there. Who had access to his private quarters?",
    ]);
    return pick([
      "The maestro is gone and the fog is thick. I need evidence — something physical, something found at the scene.",
      "A poisoning takes patience and knowledge. Share the case file — I need something concrete.",
      "I remember fragments. Something herbal... something metallic. But I need more to name a face.",
    ]);
  },
};

export const CASES = {
  easy:   EASY_CASE,
  medium: MEDIUM_CASE,
  hard:   HARD_CASE,
};

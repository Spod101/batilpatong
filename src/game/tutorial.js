import { S, TUT_CFG } from './state.js';
import { addFact }    from './tokenEngine.js';
import { aiRespond }  from './aiWitness.js';
import { updateBar }  from '../ui/tokenBar.js';
import { renderCloud, animateForgot } from '../ui/memoryCloud.js';
import { renderCF }   from '../ui/caseFile.js';
import { addChat, updateQCounter } from '../ui/chatTerminal.js';
import {
  setTutMsg, tutOk, tutHint,
  showTutPanel, updateStepNum, showStartWrap, hideStartWrap,
} from '../ui/tutorialPanel.js';
import { lockAll, lockEl, unlockEl, unlockFact, hlEl, clearHL } from '../ui/helpers.js';

const STEPS = [
  {
    title: 'Welcome, Detective.',
    msg: 'Your AI witness has a faulty memory.\n\nWhen it holds too much information, it forgets the oldest facts to make room for new ones.\n\nYour job: feed it the right clues to solve a case.\n\nClick "Begin" to start training.',
    showNext: true, nextLabel: 'Begin Training',
    enter() { lockAll(); unlockEl('btn-tut-next'); },
  },
  {
    title: 'Step 1 — Feed the Witness',
    msg: 'This is your Case File on the right.\n\nDrag the fact about "the glove" into the green Witness Memory area on the left.\n\nOn mobile: tap the fact, then tap the memory area.',
    enter() {
      lockAll(); clearHL();
      unlockFact('tut_glove');
      hlEl('fact-tut_glove'); hlEl('memory-cloud');
    },
  },
  {
    title: 'Step 2 — Ask a Question',
    msg: 'The witness now knows one fact.\n\nType anything in the box below (e.g. "Who is the thief?") and click Submit.',
    enter() {
      lockAll(); clearHL();
      unlockEl('chat-input'); unlockEl('btn-submit');
      hlEl('chat-input'); hlEl('btn-submit');
    },
  },
  {
    title: 'Step 3 — More Clues',
    msg: "The witness couldn't name the thief with just one clue. It needs more.\n\nDrag \"The theft happened at midnight\" into the memory cloud.",
    enter() {
      lockAll(); clearHL();
      unlockFact('tut_midnight');
      hlEl('fact-tut_midnight'); hlEl('memory-cloud');
    },
  },
  {
    title: 'Step 4 — Memory Overflow',
    msg: 'Two clues were enough to solve it! But memory is limited.\n\nNow drag the third fact ("A window was left open") into the memory cloud. Watch what happens.',
    enter() {
      S.t4WaitedQuery = false;
      lockAll(); clearHL();
      unlockFact('tut_window');
      hlEl('fact-tut_window'); hlEl('memory-cloud');
    },
  },
  {
    title: 'Step 5 — Summarize',
    msg: "The glove clue was forgotten! Without it, the witness can't name the thief.\n\nYou can compress two facts into one to save space.\n\nClick the Summarize button to begin.",
    enter() {
      S.t5Phase = 'click_summarize';
      lockAll(); clearHL();
      unlockEl('btn-summarize');
      hlEl('btn-summarize');
    },
  },
  {
    title: 'Training Complete!',
    msg: 'You compressed information to preserve the crucial clue. By managing memory wisely, the witness could identify the thief.\n\nYou are ready for a real case.',
    enter() {
      lockAll(); clearHL();
      showStartWrap();
    },
  },
];

function enterStep(n) {
  S.tutStep = n;
  updateStepNum(n);
  const st = STEPS[n];
  if (!st) return;
  hideStartWrap();
  setTutMsg(st.title, st.msg, st.showNext || false, st.nextLabel || 'Next →');
  clearHL();
  if (st.enter) st.enter();
}

export function advanceTut() {
  enterStep(S.tutStep + 1);
}

export function isTutAllowed(fid) {
  switch (S.tutStep) {
    case 1: return fid === 'tut_glove';
    case 3: return fid === 'tut_midnight';
    case 4: return fid === 'tut_window';
    case 5: return S.t5Phase === 'drag_glove' && fid === 'tut_glove';
    default: return false;
  }
}

function tutFactAdded(factId, forgotIds) {
  const delay = forgotIds.length > 0 ? 500 : 0;
  setTimeout(() => {
    switch (S.tutStep) {
      case 1:
        if (factId === 'tut_glove') {
          tutOk('The witness now knows that fact. Notice the token bar filled up a little.', true);
        }
        break;

      case 3:
        if (factId === 'tut_midnight') {
          tutOk('Both facts are in memory. Watch this…');
          setTimeout(() => {
            addChat('player', 'Who is the thief?');
            const r = aiRespond();
            S.queryCount++; updateQCounter();
            setTimeout(() => {
              addChat('ai', r);
              tutOk('When both facts were remembered, the witness solved the case!\n\nBut what if memory runs out?', true);
            }, 580);
          }, 700);
        }
        break;

      case 4:
        if (factId === 'tut_window') {
          const gloveGone = !S.memFacts.some(f => f.id === 'tut_glove');
          if (gloveGone) {
            tutOk('The witness forgot the glove fact! Memory is limited.\n\nNow ask who the thief is again.', false);
            unlockEl('chat-input'); unlockEl('btn-submit');
            clearHL(); hlEl('chat-input'); hlEl('btn-submit');
          }
        }
        break;

      case 5:
        if (S.t5Phase === 'drag_glove' && factId === 'tut_glove') {
          tutOk('The glove is back in memory! Watch this…');
          setTimeout(() => {
            addChat('player', 'Who is the thief?');
            const r = aiRespond();
            S.queryCount++; updateQCounter();
            setTimeout(() => {
              addChat('ai', r);
              tutOk('Excellent! By compressing information, you preserved the crucial clue.', true);
            }, 580);
          }, 700);
        }
        break;
    }
  }, delay);
}

export function onQueryDone() {
  switch (S.tutStep) {
    case 2:
      tutOk("The witness responded but couldn't name the thief. It needs more clues.", true);
      break;
    case 4:
      if (!S.t4WaitedQuery) {
        S.t4WaitedQuery = true;
        setTimeout(() => {
          tutOk("Without the glove fact, the witness can't identify the thief.\n\nYou must carefully manage what it remembers.", true);
        }, 300);
      }
      break;
  }
}

export function onMergeDone(id1, id2) {
  if (S.tutStep !== 5) return;
  S.t5Phase = 'drag_glove';
  setTimeout(() => {
    setTutMsg(
      'Step 5 — Drag the Glove Back',
      'The two facts merged into one, freeing space.\n\nNow drag the glove fact back from the case file into memory.',
      false,
    );
    unlockFact('tut_glove');
    renderCF();
    clearHL(); hlEl('fact-tut_glove'); hlEl('memory-cloud');
  }, 350);
}

// Called by main.js when a fact is dropped on the cloud during the tutorial
export function handleDrop(fid, callbacks) {
  if (!isTutAllowed(fid)) {
    tutHint('Try dragging the highlighted fact.');
    return;
  }
  tutHint('');
  S.selectedFact = null;
  document.querySelectorAll('.fact-token.sel-fact').forEach(el => el.classList.remove('sel-fact'));

  const { added, forgotIds } = addFact(fid);
  if (!added) return;

  if (forgotIds.length) {
    animateForgot(forgotIds, () => {
      renderCloud(); renderCF(); updateBar();
    });
  } else {
    renderCloud(); renderCF(); updateBar();
  }

  tutFactAdded(fid, forgotIds);
}

// Called when summarize button is clicked in tutorial step 5
export function onSummarizeClicked() {
  if (S.tutStep === 5 && S.t5Phase === 'click_summarize') {
    S.t5Phase = 'select_facts';
    setTutMsg(
      STEPS[5].title,
      'Now click two facts in the memory cloud (the glowing bubbles) to select them.',
      false,
    );
    lockEl('chat-input'); lockEl('btn-submit');
  }
}

// Called during summarize selection phase
export function onBubbleSelected(count) {
  if (S.tutStep === 5 && S.t5Phase === 'select_facts' && count === 2) {
    setTutMsg(STEPS[5].title, 'Both facts selected! Now click "Confirm Merge" to merge them.', false);
  }
}

export function initTutorial() {
  Object.assign(S, {
    phase: 'tutorial',
    tutStep: 0,
    t4WaitedQuery: false,
    t5Phase: 'click_summarize',
    memFacts: [],
    tokenUsage: 0,
    tokenLimit: TUT_CFG.tokenLimit,
    factCost: TUT_CFG.factCost,
    queryCount: 0,
    maxQueries: TUT_CFG.maxQueries,
    isSummarizing: false,
    sumSelected: [],
    selectedFact: null,
    peakToken: 0,
    usedSummarize: false,
    caseSolved: false,
    locked: new Set(),
    draggingId: null,
  });
  S.cfFacts = TUT_CFG.facts.map(f => ({ ...f, cost: TUT_CFG.factCost, inMemory: false }));

  document.getElementById('screen-game').style.display = 'flex';
  document.getElementById('screen-end').style.display  = 'none';
  document.getElementById('btn-accuse').style.display  = 'none';
  document.getElementById('qCounter').style.display    = 'none';
  document.getElementById('chat-log').innerHTML        = '';
  showTutPanel();

  // Reset summarize UI
  document.getElementById('btn-confirm-merge').style.display = 'none';
  document.getElementById('btn-cancel-sum').style.display    = 'none';
  const sb = document.getElementById('btn-summarize');
  sb.classList.remove('sum-active');
  sb.textContent = 'Summarize';

  renderCF(); renderCloud(); updateBar(); updateQCounter();
  enterStep(0);
}

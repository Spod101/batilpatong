import { supabase } from './supabase.js';

const DB_NAME        = 'fading-testimony';
const DB_VERSION     = 3;
const STORE_SESSIONS = 'game_sessions';
const STORE_PLAYER   = 'player';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
        const s = db.createObjectStore(STORE_SESSIONS, { keyPath: 'id', autoIncrement: true });
        s.createIndex('score',     'score',     { unique: false });
        s.createIndex('createdAt', 'createdAt', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_PLAYER)) {
        db.createObjectStore(STORE_PLAYER, { keyPath: 'key' });
      }
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}

function getSessionToken() {
  let token = localStorage.getItem('ft_session_token');
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem('ft_session_token', token);
  }
  return token;
}

// ── Player name (localStorage for synchronous access) ──────
export function getPlayerName() {
  return localStorage.getItem('ft_player_name') || null;
}

export function setPlayerName(name) {
  const trimmed = (name || '').trim().substring(0, 24);
  if (trimmed) {
    localStorage.setItem('ft_player_name', trimmed);
  } else {
    localStorage.removeItem('ft_player_name');
  }
  return trimmed;
}

export async function saveSession(data) {
  const record = {
    ...data,
    sessionToken: getSessionToken(),
    playerName: data.playerName || getPlayerName() || null,
    createdAt: new Date().toISOString(),
  };

  // local save
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_SESSIONS, 'readwrite');
    const store = tx.objectStore(STORE_SESSIONS);
    const req   = store.add(record);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = e => reject(e.target.error);
  });

  // remote save (fire-and-forget)
  if (supabase) {
    supabase.from('game_sessions').insert({
      session_token:  record.sessionToken,
      player_name:    record.playerName   ?? null,
      case_solved:    record.caseSolved   ?? false,
      queries_used:   record.queriesUsed  ?? 0,
      query_count:    record.queryCount   ?? 0,
      peak_tokens:    record.peakTokens   ?? 0,
      summarize_used: record.summarizeUsed ?? false,
      accused_id:     record.accusedId    ?? null,
      score:          record.score        ?? 0,
      difficulty:     record.difficulty   ?? 'MEDIUM',
      case_id:        record.caseId       ?? 'medium',
      created_at:     record.createdAt,
    }).then(({ error }) => {
      if (error) console.warn('Supabase session save failed:', error.message);
    });
  }
}

export async function getLeaderboard() {
  if (supabase) {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('session_token, player_name, score, query_count, queries_used, peak_tokens, summarize_used, accused_id, difficulty, case_id, created_at')
      .eq('case_solved', true)
      .order('score', { ascending: false })
      .limit(100);

    if (!error && data?.length) {
      return data.map(r => ({
        sessionToken:  r.session_token,
        playerName:    r.player_name,
        score:         r.score,
        queryCount:    r.query_count,
        queriesUsed:   r.queries_used,
        peakTokens:    r.peak_tokens,
        summarizeUsed: r.summarize_used,
        accusedId:     r.accused_id,
        difficulty:    r.difficulty,
        caseId:        r.case_id,
        createdAt:     r.created_at,
        caseSolved:    true,
      }));
    }
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_SESSIONS, 'readonly');
    const store = tx.objectStore(STORE_SESSIONS);
    const req   = store.getAll();
    req.onsuccess = () => {
      const sorted = req.result
        .filter(s => s.caseSolved)
        .sort((a, b) => b.score - a.score)
        .slice(0, 100);
      resolve(sorted);
    };
    req.onerror = e => reject(e.target.error);
  });
}

export async function isTutorialComplete() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_PLAYER, 'readonly');
    const store = tx.objectStore(STORE_PLAYER);
    const req   = store.get('tutorialComplete');
    req.onsuccess = () => resolve(!!req.result?.value);
    req.onerror   = e => reject(e.target.error);
  });
}

export async function setTutorialComplete() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_PLAYER, 'readwrite');
    const store = tx.objectStore(STORE_PLAYER);
    const req   = store.put({ key: 'tutorialComplete', value: true });
    req.onsuccess = () => resolve();
    req.onerror   = e => reject(e.target.error);
  });
}

export async function saveCurrentGame(snapshot) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_PLAYER, 'readwrite');
    const store = tx.objectStore(STORE_PLAYER);
    const req   = store.put({ key: 'savedGame', value: snapshot });
    req.onsuccess = () => resolve();
    req.onerror   = e => reject(e.target.error);
  });
}

export async function loadCurrentGame() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_PLAYER, 'readonly');
    const store = tx.objectStore(STORE_PLAYER);
    const req   = store.get('savedGame');
    req.onsuccess = () => resolve(req.result?.value ?? null);
    req.onerror   = e => reject(e.target.error);
  });
}

export async function clearCurrentGame() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_PLAYER, 'readwrite');
    const store = tx.objectStore(STORE_PLAYER);
    const req   = store.delete('savedGame');
    req.onsuccess = () => resolve();
    req.onerror   = e => reject(e.target.error);
  });
}

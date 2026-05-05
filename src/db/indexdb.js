const DB_NAME      = 'fading-testimony';
const DB_VERSION   = 1;
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

export async function saveSession(data) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_SESSIONS, 'readwrite');
    const store = tx.objectStore(STORE_SESSIONS);
    const req   = store.add({
      ...data,
      sessionToken: getSessionToken(),
      createdAt: new Date().toISOString(),
    });
    req.onsuccess = () => resolve(req.result);
    req.onerror   = e => reject(e.target.error);
  });
}

export async function getLeaderboard() {
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

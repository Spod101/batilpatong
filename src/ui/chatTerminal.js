import { S } from '../game/state.js';

export function addChat(role, txt) {
  const log = document.getElementById('chat-log');
  const m   = document.createElement('div');
  m.className = `chat-msg ${role === 'system' ? 'sys' : role}`;
  m.textContent = txt;
  log.appendChild(m);
  log.scrollTop = log.scrollHeight;
}

export function clearChat() {
  document.getElementById('chat-log').innerHTML = '';
}

export function updateQCounter() {
  const el = document.getElementById('qCounter');
  el.textContent = S.phase === 'game'
    ? `Queries: ${S.queryCount} / ${S.maxQueries}`
    : `Queries: ${S.queryCount}`;
}

export function getInputValue() {
  return document.getElementById('chat-input').value.trim();
}

export function clearInput() {
  document.getElementById('chat-input').value = '';
}

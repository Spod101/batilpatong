import { S } from '../game/state.js';

export function addChat(role, txt) {
  const log = document.getElementById('chat-log');
  const m   = document.createElement('div');
  m.className = `chat-msg ${role === 'system' ? 'sys' : role}`;
  m.textContent = txt;
  log.appendChild(m);
  log.scrollTop = log.scrollHeight;
}

export function addChatPending() {
  const log = document.getElementById('chat-log');
  const m   = document.createElement('div');
  m.className = 'chat-msg ai pending';
  m.textContent = '. . .';
  log.appendChild(m);
  log.scrollTop = log.scrollHeight;
  return m;
}

export function resolveChatPending(el, txt) {
  el.classList.remove('pending');
  el.textContent = txt;
  const log = document.getElementById('chat-log');
  log.scrollTop = log.scrollHeight;
}

export function clearChat() {
  document.getElementById('chat-log').innerHTML = '';
}

export function updateQCounter() {
  const el = document.getElementById('qCounter');
  if (S.phase === 'game') {
    el.textContent = `Interrogation: ${S.queryTokenUsed} / ${S.queryTokenLimit}t`;
  } else {
    el.textContent = `Interrogation: ${S.queryTokenUsed}t`;
  }
}

export function getInputValue() {
  return document.getElementById('chat-input').value.trim();
}

export function clearInput() {
  document.getElementById('chat-input').value = '';
}

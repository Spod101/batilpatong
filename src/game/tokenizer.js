import { Tiktoken } from 'js-tiktoken';
import cl100k_base from 'js-tiktoken/ranks/cl100k_base';

let _encoding = null;

function getEncoding() {
  if (_encoding) return _encoding;
  try {
    _encoding = new Tiktoken(cl100k_base);
  } catch {
    _encoding = null;
  }
  return _encoding;
}

export function countTokens(text) {
  const cleaned = (text || '').trim();
  if (!cleaned) return 0;
  const enc = getEncoding();
  if (enc) {
    try {
      return enc.encode(cleaned).length;
    } catch {
      // Fall through to simple word count.
    }
  }
  return cleaned.split(/\s+/).filter(Boolean).length;
}

export function countTokensForFact(text, fallback) {
  const ct = countTokens(text);
  if (ct > 0) return ct;
  return fallback || 1;
}

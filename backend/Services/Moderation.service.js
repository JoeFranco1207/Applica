import { getBlocklistWords } from './Blocklist.service.js';

// Default fallback blocklist when DB is not available or empty
const DEFAULT_BLOCKLIST = [
  'sex', 'porn', 'pornography', 'xxx', 'nude', 'nudity', 'sexual', 'rape', 'kill', 'terror', 'bomb',
  'drug', 'cocaine', 'heroin', 'meth', 'succ', 'fetish'
];

// Async moderation that loads admin blocklist from DB and falls back to defaults
export const moderateText = async (text, options = {}) => {
  if (!text || typeof text !== 'string') return { isFlagged: false, matched: [] };

  let blocklist = DEFAULT_BLOCKLIST.slice();
  try {
    const dbWords = await getBlocklistWords();
    if (Array.isArray(dbWords) && dbWords.length) {
      blocklist = [...new Set([...dbWords, ...blocklist])];
    }
  } catch (err) {
    console.warn('Failed to load blocklist from DB, using defaults', err.message || err);
  }

  const lower = text.toLowerCase();
  const matched = [];
  for (const word of blocklist) {
    const safe = (word || '').toString().trim();
    if (!safe) continue;
    const re = new RegExp(`\\b${safe.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\b`, 'i');
    if (re.test(lower)) matched.push(safe);
  }

  return {
    isFlagged: matched.length > 0,
    matched,
  };
};

export default moderateText;

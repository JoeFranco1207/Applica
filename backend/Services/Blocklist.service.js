import Blocklist from '../Model/BlocklistSchema.js';

export const getBlocklistWords = async () => {
  try {
    const docs = await Blocklist.find().lean();
    return docs.map(d => (d.word || '').toLowerCase()).filter(Boolean);
  } catch (err) {
    console.error('Error loading blocklist from DB:', err);
    return [];
  }
};

export const addBlocklistWord = async (word) => {
  if (!word || typeof word !== 'string') throw new Error('Invalid word');
  const w = word.trim().toLowerCase();
  const existing = await Blocklist.findOne({ word: w });
  if (existing) return existing;
  const created = await Blocklist.create({ word: w });
  return created;
};

export const removeBlocklistWord = async (idOrWord) => {
  if (!idOrWord) throw new Error('Missing identifier');
  if (typeof idOrWord === 'string' && idOrWord.match(/^[0-9a-fA-F]{24}$/)) {
    return await Blocklist.findByIdAndDelete(idOrWord);
  }
  return await Blocklist.findOneAndDelete({ word: (idOrWord || '').toLowerCase() });
};

export default { getBlocklistWords, addBlocklistWord, removeBlocklistWord };

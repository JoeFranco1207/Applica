import mongoose from 'mongoose';

const blocklistSchema = new mongoose.Schema({
  word: { type: String, required: true, trim: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Blocklist', blocklistSchema);

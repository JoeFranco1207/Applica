import mongoose from 'mongoose';

const adminAccessSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
});

export default mongoose.model('AdminAccess', adminAccessSchema);

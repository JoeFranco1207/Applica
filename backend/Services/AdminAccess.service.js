import AdminAccess from '../Model/AdminAccessSchema.js';
import crypto from 'crypto';

export const generateAdminAccessToken = async (adminCode, options = {}) => {
  // If process.env.ADMIN_SECRET is set, require it matches adminCode; otherwise allow generation
  if (process.env.ADMIN_SECRET && adminCode !== process.env.ADMIN_SECRET) {
    throw new Error('Invalid admin code');
  }

  // create a random token
  const token = crypto.randomBytes(16).toString('hex');
  const expiresIn = options.expiresIn || 1000 * 60 * 60 * 24; // default 24h
  const doc = await AdminAccess.create({ token, expiresAt: new Date(Date.now() + expiresIn) });
  return doc;
};

export const validateAdminAccessToken = async (token) => {
  if (!token) return false;
  const doc = await AdminAccess.findOne({ token }).lean();
  if (!doc) return false;
  if (doc.expiresAt && new Date(doc.expiresAt) < new Date()) return false;
  return true;
};

export const revokeAdminAccessToken = async (token) => {
  if (!token) return null;
  return await AdminAccess.findOneAndDelete({ token });
};

export default { generateAdminAccessToken, validateAdminAccessToken, revokeAdminAccessToken };

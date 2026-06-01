import AppSuccessful from '../Middleware/AppSuccessful.js';
import AppError from '../Middleware/AppError.js';
import { generateAdminAccessToken, validateAdminAccessToken, revokeAdminAccessToken } from '../Services/AdminAccess.service.js';

export const generateAdminPathController = async (req, res, next) => {
  try {
    const { adminCode, expiresIn } = req.body || {};
    if (!adminCode) return next(new AppError('Missing adminCode', 400));
    const doc = await generateAdminAccessToken(adminCode, { expiresIn });
    // return the public path
    const path = `/admin-access/${doc.token}`;
    return res.status(201).json(new AppSuccessful('Admin access path generated', 201, { path, token: doc.token, expiresAt: doc.expiresAt }));
  } catch (err) {
    next(err);
  }
};

export const validateAdminPathController = async (req, res, next) => {
  try {
    const token = req.params.token;
    const ok = await validateAdminAccessToken(token);
    if (!ok) return next(new AppError('Invalid or expired token', 404));
    return res.status(200).json(new AppSuccessful('Token valid', 200, { valid: true }));
  } catch (err) { next(err); }
};

export const revokeAdminPathController = async (req, res, next) => {
  try {
    const token = req.params.token;
    const removed = await revokeAdminAccessToken(token);
    return res.status(200).json(new AppSuccessful('Token revoked', 200, removed));
  } catch (err) { next(err); }
};

export default { generateAdminPathController, validateAdminPathController, revokeAdminPathController };

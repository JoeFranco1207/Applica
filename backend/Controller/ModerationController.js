import AppSuccessful from '../Middleware/AppSuccessful.js';
import AppError from '../Middleware/AppError.js';
import Post from '../Model/PostSchema.js';
import Blocklist from '../Model/BlocklistSchema.js';
import { getBlocklistWords, addBlocklistWord, removeBlocklistWord } from '../Services/Blocklist.service.js';
import { createSystemNotificationService } from '../Services/Notification.service.js';

export const getModerationQueueController = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = { restricted: true };
    const [posts, total] = await Promise.all([
      Post.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Post.countDocuments(filter),
    ]);

    return res.status(200).json(new AppSuccessful('Moderation queue fetched', 200, { posts, total, page, limit }));
  } catch (err) {
    next(err);
  }
};

export const restrictPostController = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const { reason } = req.body;
    const post = await Post.findById(postId);
    if (!post) return next(new AppError('Post not found', 404));
    post.restricted = true;
    post.restrictionReason = reason || 'Restricted by admin';
    await post.save();
    try {
      await createSystemNotificationService(post.author, `An administrator restricted your post: ${post.restrictionReason}`, 'moderation');
    } catch (err) { /* ignore notification failures */ }
    return res.status(200).json(new AppSuccessful('Post restricted', 200, post));
  } catch (err) { next(err); }
};

export const clearPostRestrictionController = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post) return next(new AppError('Post not found', 404));
    post.restricted = false;
    post.restrictionReason = '';
    await post.save();
    try {
      await createSystemNotificationService(post.author, `An administrator restored your post. It is no longer restricted.`, 'moderation');
    } catch (err) { /* ignore */ }
    return res.status(200).json(new AppSuccessful('Post restriction cleared', 200, post));
  } catch (err) { next(err); }
};

export const getBlocklistController = async (req, res, next) => {
  try {
    const docs = await Blocklist.find().sort({ word: 1 }).lean();
    return res.status(200).json(new AppSuccessful('Blocklist fetched', 200, docs));
  } catch (err) { next(err); }
};

export const addBlocklistController = async (req, res, next) => {
  try {
    const { word } = req.body;
    if (!word || typeof word !== 'string') return next(new AppError('Word is required', 400));
    const created = await addBlocklistWord(word);
    return res.status(201).json(new AppSuccessful('Blocklist word added', 201, created));
  } catch (err) { next(err); }
};

export const removeBlocklistController = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!id) return next(new AppError('Identifier required', 400));
    const removed = await removeBlocklistWord(id);
    return res.status(200).json(new AppSuccessful('Blocklist entry removed', 200, removed));
  } catch (err) { next(err); }
};

export default {
  getModerationQueueController,
  restrictPostController,
  clearPostRestrictionController,
  getBlocklistController,
  addBlocklistController,
  removeBlocklistController,
};

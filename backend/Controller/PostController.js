import AppSuccessful from '../Middleware/AppSuccessful.js';
import {
  createPostService,
  getAllPostsService,
  getPostByIdService,
  updatePostService,
  deletePostService,
  getPostsByAuthorService,
  togglePostLikeService,
  addCommentService,
  deleteCommentService,
  recordViewService,
  sharePostService,
  repostService,
  removeRepostService,
} from '../Services/Post.service.js';
import { sendNotificationToUser } from '../server.js';

export const createPostController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const post = await createPostService(userId, req.body);
    return res.status(201).json(new AppSuccessful('Post created successfully', 201, post));
  } catch (err) {
    console.log(err);
    next(err);
  }
};

export const getPostsController = async (req, res, next) => {
  try {
    const posts = await getAllPostsService();
    return res.status(200).json(new AppSuccessful('Posts fetched successfully', 200, posts));
  } catch (err) {
    console.log(err);
    next(err);
  }
};

export const getPostController = async (req, res, next) => {
  try {
    const post = await getPostByIdService(req.params.id);
    return res.status(200).json(new AppSuccessful('Post fetched', 200, post));
  } catch (err) {
    console.log(err);
    next(err);
  }
};

export const updatePostController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const post = await updatePostService(userId, req.params.id, req.body);
    return res.status(200).json(new AppSuccessful('Post updated', 200, post));
  } catch (err) {
    console.log(err);
    next(err);
  }
};

export const deletePostController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await deletePostService(userId, req.params.id);
    return res.status(200).json(new AppSuccessful('Post deleted', 200, null));
  } catch (err) {
    console.log(err);
    next(err);
  }
};

export const getPostsByAuthorController = async (req, res, next) => {
  try {
    const posts = await getPostsByAuthorService(req.params.authorId);
    return res.status(200).json(new AppSuccessful('Author posts fetched', 200, posts));
  } catch (err) {
    console.log(err);
    next(err);
  }
};

export const togglePostLikeController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const post = await togglePostLikeService(userId, req.params.id);
    
    // Emit real-time notification
    sendNotificationToUser(post.author, {
      type: 'like',
      actor: userId,
      postId: req.params.id,
      message: `Someone reacted to your post`,
      timestamp: new Date(),
    });
    
    return res.status(200).json(new AppSuccessful('Post like toggled', 200, post));
  } catch (err) {
    console.log(err);
    next(err);
  }
};

// Comment endpoints
export const addCommentController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { content } = req.body;
    const post = await addCommentService(userId, req.params.id, content);
    
    // Emit real-time notification
    sendNotificationToUser(post.author, {
      type: 'comment',
      actor: userId,
      postId: req.params.id,
      message: `Someone commented on your post`,
      timestamp: new Date(),
    });
    
    return res.status(201).json(new AppSuccessful('Comment added', 201, post));
  } catch (err) {
    console.log(err);
    next(err);
  }
};

export const deleteCommentController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id: postId, commentId } = req.params;
    const post = await deleteCommentService(userId, postId, commentId);
    
    return res.status(200).json(new AppSuccessful('Comment deleted', 200, post));
  } catch (err) {
    console.log(err);
    next(err);
  }
};

// View endpoint
export const recordViewController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const post = await recordViewService(userId, req.params.id);
    
    // Emit real-time notification
    sendNotificationToUser(post.author, {
      type: 'view',
      actor: userId,
      postId: req.params.id,
      message: `Someone viewed your post`,
      timestamp: new Date(),
    });
    
    return res.status(200).json(new AppSuccessful('View recorded', 200, post));
  } catch (err) {
    console.log(err);
    next(err);
  }
};

// Share endpoint
export const sharePostController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const post = await sharePostService(userId, req.params.id);
    
    // Emit real-time notification
    sendNotificationToUser(post.author, {
      type: 'share',
      actor: userId,
      postId: req.params.id,
      message: `Someone shared your post`,
      timestamp: new Date(),
    });
    
    return res.status(200).json(new AppSuccessful('Post shared', 200, post));
  } catch (err) {
    console.log(err);
    next(err);
  }
};

// Repost endpoints
export const repostController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const post = await repostService(userId, req.params.id);
    
    // Emit real-time notification
    sendNotificationToUser(post.author, {
      type: 'repost',
      actor: userId,
      postId: req.params.id,
      message: `Someone reposted your post`,
      timestamp: new Date(),
    });
    
    return res.status(200).json(new AppSuccessful('Post reposted', 200, post));
  } catch (err) {
    console.log(err);
    next(err);
  }
};

export const removeRepostController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const post = await removeRepostService(userId, req.params.id);
    
    return res.status(200).json(new AppSuccessful('Repost removed', 200, post));
  } catch (err) {
    console.log(err);
    next(err);
  }
};
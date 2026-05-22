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
  toggleCommentLikeService,
  addReplyService,
  recordViewService,
  sharePostService,
  repostService,
  removeRepostService,
} from '../Services/Post.service.js';
import { sendNotificationToUser } from '../Services/SocketIO.service.js';

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
    const page = req.query.page ? Math.max(1, parseInt(req.query.page, 10) || 1) : null;
    const limit = req.query.limit ? Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 10)) : null;
    const skip = page ? (page - 1) * limit : undefined;
    const includeTotal = page === 1;

    if (page) {
      const data = await getAllPostsService({
        includeArchived: false,
        limit,
        skip,
        includeTotal,
      });

      const hasMore = data.posts.length === limit;
      const totalPages = includeTotal && data.total > 0 ? Math.ceil(data.total / limit) : 0;

      return res.status(200).json(
        new AppSuccessful('Posts fetched successfully', 200, {
          posts: data.posts,
          total: includeTotal ? data.total : undefined,
          page,
          limit,
          totalPages: includeTotal ? totalPages : undefined,
          hasMore,
        })
      );
    }

    const data = await getAllPostsService({ includeArchived: false });
    return res.status(200).json(new AppSuccessful('Posts fetched successfully', 200, data.posts));
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
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 5));
    const skip = (page - 1) * limit;
    const includeTotal = page === 1;

    const data = await getPostsByAuthorService(req.params.authorId, {
      includeArchived: false,
      limit,
      skip,
      includeTotal,
    });

    const totalPages = includeTotal && data.total > 0 ? Math.ceil(data.total / limit) : 0;
    const hasMore = data.posts.length === limit;

    return res.status(200).json(
      new AppSuccessful('Author posts fetched', 200, {
        posts: data.posts,
        total: includeTotal ? data.total : undefined,
        page,
        limit,
        totalPages: includeTotal ? totalPages : undefined,
        hasMore,
      })
    );
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

export const toggleCommentLikeController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const post = await toggleCommentLikeService(userId, req.params.id, req.params.commentId);

    return res.status(200).json(new AppSuccessful('Comment like toggled', 200, post));
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

// Reply to comment endpoint
export const addReplyController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id: postId, commentId } = req.params;
    const { content } = req.body;
    const post = await addReplyService(userId, postId, commentId, content);
    
    // Emit real-time notification
    sendNotificationToUser(post.author, {
      type: 'reply',
      actor: userId,
      postId: postId,
      message: `Someone replied to a comment on your post`,
      timestamp: new Date(),
    });
    
    return res.status(201).json(new AppSuccessful('Reply added', 201, post));
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
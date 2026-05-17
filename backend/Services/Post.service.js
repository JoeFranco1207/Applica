import AppError from '../Middleware/AppError.js';
import mongoose from 'mongoose';
import Post from '../Model/PostSchema.js';
import User from '../Model/UserSchema.js';
import Notification from '../Model/NotificationSchema.js';
import { createNotificationService } from './Notification.service.js';

export const createPostService = async (userId, postData = {}) => {
  const { content, tags, media, jobId, location } = postData;

  if (!content || !content.trim()) {
    throw new AppError('Post content is required', 400);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const sanitizedTags = Array.isArray(tags)
    ? tags.map((tag) => tag.trim()).filter(Boolean)
    : [];

  const postMedia = media && media.data && media.type
    ? {
        type: media.type,
        data: media.data,
        contentType: media.contentType,
        fileName: media.fileName,
      }
    : undefined;

  const postLocation = location && location.region
    ? {
        region: location.region,
        city: location.city || '',
        coordinates: location.coordinates || {},
      }
    : undefined;

  const newPost = await Post.create({
    content: content.trim(),
    tags: sanitizedTags,
    media: postMedia,
    location: postLocation,
    author: user._id,
    authorName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
    authorRole: user.role,
    authorAvatar: (user.role === 'employer' ? user.companyLogo : user.profilePicture) || null,
    likes: [],
    jobId,
  });

  return newPost;
};

export const getAllPostsService = async (options = {}) => {
  const { author, includeArchived = false } = options;
  const filter = {};
  if (author) filter.author = author;
  if (!includeArchived) filter.archived = { $ne: true };

  const posts = await Post.find(filter).sort({ createdAt: -1 });
  
  // Populate fresh avatar data from user profiles
  const enrichedPosts = await Promise.all(
    posts.map(async (post) => {
      const postObj = post.toObject();
      try {
        const user = await User.findById(post.author);
        if (user) {
          postObj.authorAvatar = user.role === 'employer' ? user.companyLogo : user.profilePicture;
          postObj.authorName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
          postObj.authorRole = user.role;
        }
      } catch (err) {
        console.log('Error enriching post with user data:', err);
      }
      // Ensure comments have authorName and authorAvatar populated
      if (Array.isArray(postObj.comments) && postObj.comments.length > 0) {
        await Promise.all(postObj.comments.map(async (c) => {
          try {
            if (!c.authorName || !c.authorAvatar) {
              const cu = await User.findById(c.author);
              if (cu) {
                c.authorName = c.authorName || `${cu.firstName || ''} ${cu.lastName || ''}`.trim() || cu.email;
                c.authorAvatar = c.authorAvatar || (cu.role === 'employer' ? cu.companyLogo : cu.profilePicture) || null;
              }
            }
          } catch (err) {
            /* ignore */
          }
        }));
      }
      return postObj;
    })
  );

  return enrichedPosts;
};

export const getPostByIdService = async (postId) => {
  const post = await Post.findById(postId);
  if (!post) throw new AppError('Post not found', 404);
  
  // Enrich with fresh user data
  const postObj = post.toObject();
  try {
    const user = await User.findById(post.author);
    if (user) {
      postObj.authorAvatar = user.role === 'employer' ? user.companyLogo : user.profilePicture;
      postObj.authorName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
      postObj.authorRole = user.role;
    }
  } catch (err) {
    console.log('Error enriching post with user data:', err);
  }
  // Ensure comments have authorName and authorAvatar populated
  if (Array.isArray(postObj.comments) && postObj.comments.length > 0) {
    await Promise.all(postObj.comments.map(async (c) => {
      try {
        if (!c.authorName || !c.authorAvatar) {
          const cu = await User.findById(c.author);
          if (cu) {
            c.authorName = c.authorName || `${cu.firstName || ''} ${cu.lastName || ''}`.trim() || cu.email;
            c.authorAvatar = c.authorAvatar || (cu.role === 'employer' ? cu.companyLogo : cu.profilePicture) || null;
          }
        }
      } catch (err) {
        /* ignore */
      }
    }));
  }
  
  return postObj;
};

export const togglePostLikeService = async (userId, postId) => {
  const post = await Post.findById(postId);
  if (!post) throw new AppError('Post not found', 404);
  const likeIndex = post.likes.findIndex((id) => id.toString() === userId.toString());
  if (likeIndex >= 0) {
    post.likes.splice(likeIndex, 1);
  } else {
    post.likes.push(userId);
    
    // Create notification for post author when someone likes their post
    if (post.author.toString() !== userId.toString()) {
      const liker = await User.findById(userId);
      if (liker) {
        await createNotificationService({
          type: 'like',
          recipient: post.author,
          actor: userId,
          message: `reacted to your post`,
          postId: post._id,
        });
      }
    }
  }
  await post.save();
  
  // Enrich with fresh user data
  const postObj = post.toObject();
  try {
    const user = await User.findById(post.author);
    if (user) {
      postObj.authorAvatar = user.role === 'employer' ? user.companyLogo : user.profilePicture;
      postObj.authorName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
      postObj.authorRole = user.role;
    }
  } catch (err) {
    console.log('Error enriching post with user data:', err);
  }
  
  return postObj;
};

export const updatePostService = async (userId, postId, data = {}) => {
  const post = await Post.findById(postId);
  if (!post) throw new AppError('Post not found', 404);
  if (post.author.toString() !== userId.toString()) {
    throw new AppError('Unauthorized', 403);
  }

  const { content, tags, media, archived } = data;
  if (content !== undefined) post.content = content.trim();
  if (Array.isArray(tags)) post.tags = tags.map((t) => t.trim()).filter(Boolean);
  if (media && media.data && media.type) {
    post.media = {
      type: media.type,
      data: media.data,
      contentType: media.contentType,
      fileName: media.fileName,
    };
  }
  if (archived !== undefined) post.archived = !!archived;

  await post.save();
  
  // Enrich with fresh user data
  const postObj = post.toObject();
  try {
    const user = await User.findById(post.author);
    if (user) {
      postObj.authorAvatar = user.role === 'employer' ? user.companyLogo : user.profilePicture;
      postObj.authorName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
      postObj.authorRole = user.role;
    }
  } catch (err) {
    console.log('Error enriching post with user data:', err);
  }
  
  return postObj;
};

export const deletePostService = async (userId, postId) => {
  const post = await Post.findById(postId);
  if (!post) throw new AppError('Post not found', 404);
  if (post.author.toString() !== userId.toString()) {
    throw new AppError('Unauthorized', 403);
  }
  await Post.deleteOne({ _id: postId });
  return true;
};

export const getPostsByAuthorService = async (authorId, options = {}) => {
  return await getAllPostsService({ author: authorId, includeArchived: !!options.includeArchived });
};

// Comment functionality
export const addCommentService = async (userId, postId, commentContent) => {
  if (!commentContent || !commentContent.trim()) {
    throw new AppError('Comment content is required', 400);
  }

  const post = await Post.findById(postId);
  if (!post) throw new AppError('Post not found', 404);

  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  const comment = {
    _id: new mongoose.Types.ObjectId(),
    author: userId,
    authorName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
    authorAvatar: user.role === 'employer' ? user.companyLogo : user.profilePicture,
    content: commentContent.trim(),
    createdAt: new Date(),
  };

  post.comments.push(comment);
  await post.save();

  // Create notification for post author
  if (post.author.toString() !== userId.toString()) {
    await createNotificationService({
      type: 'comment',
      recipient: post.author,
      actor: userId,
      message: `commented on your post`,
      postId: post._id,
    });
  }

  // Return an enriched post object so frontend always receives fresh author data
  return await getPostByIdService(post._id);
};

export const deleteCommentService = async (userId, postId, commentId) => {
  const post = await Post.findById(postId);
  if (!post) throw new AppError('Post not found', 404);

  const commentIndex = post.comments.findIndex((c) => c._id.toString() === commentId);
  if (commentIndex === -1) throw new AppError('Comment not found', 404);

  const comment = post.comments[commentIndex];
  if (comment.author.toString() !== userId.toString() && post.author.toString() !== userId.toString()) {
    throw new AppError('Unauthorized to delete this comment', 403);
  }

  post.comments.splice(commentIndex, 1);
  await post.save();
  // Return an enriched post object so frontend always receives fresh author data
  return await getPostByIdService(post._id);
};

// Reply to comment functionality
export const addReplyService = async (userId, postId, commentId, replyContent) => {
  if (!replyContent || !replyContent.trim()) {
    throw new AppError('Reply content is required', 400);
  }

  const post = await Post.findById(postId);
  if (!post) throw new AppError('Post not found', 404);

  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  const comment = post.comments.find((c) => c._id.toString() === commentId);
  if (!comment) throw new AppError('Comment not found', 404);

  const reply = {
    _id: new mongoose.Types.ObjectId(),
    author: userId,
    authorName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
    authorAvatar: user.role === 'employer' ? user.companyLogo : user.profilePicture,
    content: replyContent.trim(),
    createdAt: new Date(),
  };

  if (!comment.replies) {
    comment.replies = [];
  }
  comment.replies.push(reply);
  await post.save();

  // Create notification for comment author
  if (comment.author.toString() !== userId.toString()) {
    await createNotificationService({
      type: 'reply',
      recipient: comment.author,
      actor: userId,
      message: `replied to your comment`,
      postId: post._id,
    });
  }

  return await getPostByIdService(post._id);
};

// View functionality
export const recordViewService = async (userId, postId) => {
  const post = await Post.findById(postId);
  if (!post) throw new AppError('Post not found', 404);

  const hasViewed = post.views.some((id) => id.toString() === userId.toString());
  if (!hasViewed) {
    post.views.push(userId);
    await post.save();

    // Create notification for post author only on first view
    if (post.author.toString() !== userId.toString()) {
      const viewer = await User.findById(userId);
      if (viewer) {
        await createNotificationService({
          type: 'view',
          recipient: post.author,
          actor: userId,
          message: `viewed your post`,
          postId: post._id,
        });
      }
    }
  }

  return post;
};

// Share functionality
export const sharePostService = async (userId, postId) => {
  const post = await Post.findById(postId);
  if (!post) throw new AppError('Post not found', 404);

  const hasShared = post.shares.some((s) => s.userId.toString() === userId.toString());
  if (hasShared) {
    throw new AppError('You have already shared this post', 400);
  }

  post.shares.push({
    userId,
    sharedAt: new Date(),
  });
  await post.save();

  // Create notification for post author
  if (post.author.toString() !== userId.toString()) {
    const sharer = await User.findById(userId);
    if (sharer) {
      await createNotificationService({
        type: 'share',
        recipient: post.author,
        actor: userId,
        message: `shared your post`,
        postId: post._id,
      });
    }
  }

  return post;
};

// Repost functionality
export const repostService = async (userId, postId) => {
  const post = await Post.findById(postId);
  if (!post) throw new AppError('Post not found', 404);

  if (post.author.toString() === userId.toString()) {
    throw new AppError('You cannot repost your own post', 400);
  }

  const hasReposted = post.reposts.some((r) => r.userId.toString() === userId.toString());
  if (hasReposted) {
    throw new AppError('You have already reposted this post', 400);
  }

  post.reposts.push({
    userId,
    repostedAt: new Date(),
  });
  await post.save();

  // Create notification for post author
  const reposter = await User.findById(userId);
  if (reposter) {
    await createNotificationService({
      type: 'repost',
      recipient: post.author,
      actor: userId,
      message: `reposted your post`,
      postId: post._id,
    });
  }

  return post;
};

export const removeRepostService = async (userId, postId) => {
  const post = await Post.findById(postId);
  if (!post) throw new AppError('Post not found', 404);

  const repostIndex = post.reposts.findIndex((r) => r.userId.toString() === userId.toString());
  if (repostIndex === -1) throw new AppError('You have not reposted this post', 404);

  post.reposts.splice(repostIndex, 1);
  await post.save();
  return post;
};


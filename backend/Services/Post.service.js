import AppError from '../Middleware/AppError.js';
import mongoose from 'mongoose';
import Post from '../Model/PostSchema.js';
import User from '../Model/UserSchema.js';
import Notification from '../Model/NotificationSchema.js';
import { createNotificationService, createSystemNotificationService } from './Notification.service.js';
import { moderateText } from './Moderation.service.js';

const userCanViewProfile = (targetUser, viewerId) => {
  if (!targetUser) return false;
  if (!viewerId) return targetUser.profileVisibility === 'public';
  const targetId = String(targetUser._id || targetUser.id);
  if (targetId === String(viewerId)) return true;
  if (!targetUser.profileVisibility || targetUser.profileVisibility === 'public') return true;
  if (targetUser.profileVisibility === 'private') return false;
  if (targetUser.profileVisibility === 'connections') {
    return Array.isArray(targetUser.connections) && targetUser.connections.some((conn) => String(conn) === String(viewerId));
  }
  return true;
};

const getAuthorProfileFields = (user) => {
  const canShowStatus = user?.showActivityStatus !== false;
  return {
    authorAvatar: user.role === 'employer' ? user.companyLogo : user.profilePicture || null,
    authorName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || null,
    authorRole: user.role || null,
    authorEmail: user.email || null,
    authorCompanyName: user.role === 'employer' ? user.companyName : undefined,
    authorShowActivityStatus: canShowStatus,
    authorIsOnline: canShowStatus ? !!user.isOnline : false,
    authorLastActive: canShowStatus ? user.lastActive || null : null,
    authorPresenceMode: canShowStatus ? (user.presenceMode || (user.isOnline ? 'online' : undefined)) : undefined,
  };
};

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
    // moderation state (default: not restricted)
    restricted: false,
    restrictionReason: '',
    media: postMedia,
    location: postLocation,
    author: user._id,
    authorName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
    authorRole: user.role,
    authorAvatar: (user.role === 'employer' ? user.companyLogo : user.profilePicture) || null,
    authorEmail: user.email,
    authorCompanyName: user.role === 'employer' ? user.companyName : undefined,
    likes: [],
    jobId,
  });

  // Run moderation check after creation to update status and notify user if necessary
  try {
    const mod = await moderateText(newPost.content || '');
    if (mod.isFlagged) {
      newPost.restricted = true;
      newPost.restrictionReason = mod.matched.join(', ');
      await newPost.save();

      // Notify the author about the restriction
      await createSystemNotificationService(user._id, `Your post was restricted because it contains disallowed content: ${mod.matched.join(', ')}`, 'moderation');
    }
  } catch (err) {
    console.error('Moderation check failed:', err);
  }

  return newPost;
};

export const getAllPostsService = async (options = {}) => {
  const {
    author,
    includeArchived = false,
    includeRestricted = false,
    limit,
    skip,
    includeTotal = false,
    viewerId,
    viewerRole,
  } = options;

  const filter = {};
  if (author) filter.author = author;
  if (!includeArchived) filter.archived = { $ne: true };
  if (!includeRestricted) filter.restricted = { $ne: true };

  let query = Post.find(filter).sort({ createdAt: -1 });
  if (typeof skip === 'number') query = query.skip(skip);
  if (typeof limit === 'number') query = query.limit(limit);

  const posts = await query.lean();
  const viewerIsAdmin = viewerRole === 'admin';

  const authorIds = [...new Set(posts.map((p) => p.author).filter(Boolean))];
  let users = [];
  try {
    users = await User.find({ _id: { $in: authorIds } })
      .select('-password -verificationCode -verificationCodeValidation -codeExpiration -forgotPasswordCode')
      .lean();
  } catch (err) {
    console.log('Error loading authors for feed:', err);
  }
  const userMap = new Map((users || []).map((u) => [u._id.toString(), u]));

  const filteredPosts = posts.filter((p) => {
    const authorUser = userMap.get((p.author || '').toString());
    if (!authorUser) return false;
    return viewerIsAdmin || userCanViewProfile(authorUser, viewerId);
  });

  const enriched = filteredPosts.map((p) => {
    const postObj = { ...p };
    const u = userMap.get((p.author || '').toString());
    if (u) {
      Object.assign(postObj, getAuthorProfileFields(u));
    }
    return postObj;
  });

  if (includeTotal) {
    return { posts: enriched, total: enriched.length };
  }

  return { posts: enriched };
};

export const searchPostsByQueryService = async (query, viewerId) => {
  const normalizedQuery = String(query || '').trim();
  if (normalizedQuery.length < 2) {
    return [];
  }

  const escapedQuery = normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const queryRegex = new RegExp(escapedQuery, 'i');

  const searchConditions = [
    { content: queryRegex },
    { authorName: queryRegex },
    { authorCompanyName: queryRegex },
    { tags: queryRegex },
  ];

  const posts = await Post.find({
    restricted: { $ne: true },
    archived: { $ne: true },
    $or: searchConditions,
  })
    .sort({ createdAt: -1 })
    .limit(12)
    .lean();

  const authorIds = [...new Set(posts.map((p) => p.author).filter(Boolean))];
  const authors = await User.find({ _id: { $in: authorIds } })
    .select('-password -verificationCode -verificationCodeValidation -codeExpiration -forgotPasswordCode')
    .lean();

  const authorMap = new Map((authors || []).map((author) => [String(author._id), author]));

  const visiblePosts = posts.filter((post) => {
    const author = authorMap.get(String(post.author));
    return author && userCanViewProfile(author, viewerId);
  });

  return visiblePosts.map((post) => {
    const author = authorMap.get(String(post.author)) || {};
    // Normalize media URL if necessary
    let mediaObj = null;
    if (post.media && (post.media.data || post.media.url)) {
      const raw = post.media.url || post.media.data;
      let url = raw;
      if (raw && !raw.startsWith('http') && !raw.startsWith('data:') && !raw.startsWith('/')) {
        url = `/uploads/${raw}`;
      }
      mediaObj = { ...post.media, url };
    }

    return {
      _id: post._id,
      content: post.content,
      snippet: post.content ? post.content.substring(0, 220) : '',
      authorId: post.author,
      authorName: `${author.firstName || ''} ${author.lastName || ''}`.trim() || author.email || 'Unknown author',
      authorRole: author.role || null,
      authorAvatar: author.role === 'employer' ? author.companyLogo : author.profilePicture || null,
      authorCompanyName: author.companyName || '',
      createdAt: post.createdAt,
      media: mediaObj,
    };
  });
};

export const getPostByIdService = async (postId, options = {}) => {
  const { viewerId, viewerRole } = options;
  const post = await Post.findById(postId);
  if (!post) throw new AppError('Post not found', 404);

  const author = await User.findById(post.author).lean();
  if (!author) throw new AppError('Post author not found', 404);

  const viewerIsAdmin = viewerRole === 'admin';
  const isAuthor = viewerId && String(author._id) === String(viewerId);
  if (!viewerIsAdmin && !isAuthor && !userCanViewProfile(author, viewerId)) {
    throw new AppError('Post not found', 404);
  }

  if (post.restricted && !viewerIsAdmin && !isAuthor) {
    throw new AppError('Post not found', 404);
  }

  // Enrich with fresh user data
  const postObj = post.toObject();
  try {
    Object.assign(postObj, getAuthorProfileFields(author));
  } catch (err) {
    console.log('Error enriching post with user data:', err);
  }
  // Ensure comments and replies always use the live author profile data
  if (Array.isArray(postObj.comments) && postObj.comments.length > 0) {
    await Promise.all(postObj.comments.map(async (c) => {
      try {
        const cu = await User.findById(c.author);
        if (cu) {
          Object.assign(c, getAuthorProfileFields(cu));
        }
      } catch (err) {
        /* ignore */
      }

      if (Array.isArray(c.replies) && c.replies.length > 0) {
        await Promise.all(c.replies.map(async (r) => {
          try {
            const ru = await User.findById(r.author);
            if (ru) {
              Object.assign(r, getAuthorProfileFields(ru));
            }
          } catch (err) {
            /* ignore */
          }
        }));
      }
    }));
  }
  
  return postObj;
};

export const getLikersForPostService = async (postId) => {
  const post = await Post.findById(postId);
  if (!post) throw new AppError('Post not found', 404);

  const likerIds = Array.isArray(post.likes)
    ? post.likes.map((id) => typeof id === 'object' ? (id._id || id) : id)
    : [];

  if (likerIds.length === 0) return [];

  const likers = await User.find({ _id: { $in: likerIds } })
    .select('-password -verificationCode -verificationCodeValidation -codeExpiration -forgotPasswordCode')
    .lean();

  return likers.map((u) => {
    const canShowStatus = u.showActivityStatus !== false;
    return {
      _id: u._id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      role: u.role,
      profilePicture: u.role === 'employer' ? u.companyLogo : u.profilePicture,
      companyName: u.companyName,
      isOnline: canShowStatus ? !!u.isOnline : false,
      presenceMode: canShowStatus ? (u.presenceMode || (u.isOnline ? 'online' : undefined)) : undefined,
      lastActive: canShowStatus ? u.lastActive || null : null,
    };
  });
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
      Object.assign(postObj, getAuthorProfileFields(user));
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

  // Run moderation check on updates and notify if newly restricted
  try {
    if (content !== undefined) {
      const mod = await moderateText(post.content || '');
      if (mod.isFlagged) {
        post.restricted = true;
        post.restrictionReason = mod.matched.join(', ');
        await post.save();
        await createSystemNotificationService(userId, `Your updated post was restricted because it contains disallowed content: ${mod.matched.join(', ')}`, 'moderation');
      } else if (post.restricted) {
        // If previously restricted and now clean, clear restriction and inform user
        post.restricted = false;
        post.restrictionReason = '';
        await post.save();
        await createSystemNotificationService(userId, 'Your post restriction was lifted after update.', 'moderation');
      }
    }
  } catch (err) {
    console.error('Moderation check (update) failed:', err);
  }
  
  // Enrich with fresh user data
  const postObj = post.toObject();
  try {
    const user = await User.findById(post.author);
    if (user) {
      Object.assign(postObj, getAuthorProfileFields(user));
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
  const {
    includeArchived = false,
    includeRestricted = false,
    limit = 10,
    skip = 0,
    includeTotal = true,
    requesterId,
    requesterRole,
  } = options;
  const authorObjectId = mongoose.Types.ObjectId.isValid(authorId)
    ? new mongoose.Types.ObjectId(authorId)
    : authorId;
  const filter = { author: authorObjectId };
  if (!includeArchived) filter.archived = { $ne: true };
  if (!includeRestricted) filter.restricted = { $ne: true };

  const author = await User.findById(authorId)
    .select('-password -verificationCode -verificationCodeValidation -codeExpiration -forgotPasswordCode')
    .lean();

  if (!author) {
    throw new AppError('Author not found', 404);
  }

  const viewerIsAdmin = requesterRole === 'admin';
  const viewerId = requesterId;
  const isAuthor = viewerId && String(author._id) === String(viewerId);
  if (!viewerIsAdmin && !isAuthor && !userCanViewProfile(author, viewerId)) {
    throw new AppError('Author posts not accessible', 403);
  }

  const [posts, total] = await Promise.all([
    Post.aggregate([
      { $match: filter },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          content: 1,
          tags: 1,
          media: 1,
          location: 1,
          createdAt: 1,
          author: 1,
          authorName: 1,
          authorAvatar: 1,
          authorRole: 1,
          commentsCount: { $size: { $ifNull: ['$comments', []] } },
          likesCount: { $size: { $ifNull: ['$likes', []] } },
          repostsCount: { $size: { $ifNull: ['$reposts', []] } },
          sharesCount: { $size: { $ifNull: ['$shares', []] } },
        },
      },
    ]),
    includeTotal ? Post.countDocuments(filter) : Promise.resolve(null),
  ]);

  const enrichedPosts = posts.map((post) => {
    const postObj = { ...post };
    if (author) {
      Object.assign(postObj, getAuthorProfileFields(author));
    }

    return postObj;
  });

  return { posts: enrichedPosts, total };
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
      commentId: comment._id,
    });
  }

  // Return an enriched post object so frontend always receives fresh author data
  return await getPostByIdService(post._id);
};

export const toggleCommentLikeService = async (userId, postId, commentId) => {
  const post = await Post.findById(postId);
  if (!post) throw new AppError('Post not found', 404);

  const comment = post.comments.find((c) => c._id.toString() === commentId);
  if (!comment) throw new AppError('Comment not found', 404);

  const likeIndex = comment.likes?.findIndex((id) => id.toString() === userId.toString());
  if (likeIndex >= 0) {
    comment.likes.splice(likeIndex, 1);
  } else {
    if (!comment.likes) comment.likes = [];
    comment.likes.push(userId);

    if (comment.author.toString() !== userId.toString()) {
      await createNotificationService({
        type: 'like',
        recipient: comment.author,
        actor: userId,
        message: `liked your comment`,
        postId: post._id,
        commentId: comment._id,
      });
    }
  }

  await post.save();
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
      commentId: comment._id,
      replyId: reply._id,
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

  // Enrich with fresh user data before returning
  const postObj = post.toObject();
  try {
    const user = await User.findById(post.author);
    if (user) {
      Object.assign(postObj, getAuthorProfileFields(user));
    }
  } catch (err) {
    console.log('Error enriching post with user data in recordViewService:', err);
  }

  return postObj;
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

  // Enrich with fresh user data before returning
  const postObj = post.toObject();
  try {
    const user = await User.findById(post.author);
    if (user) {
      Object.assign(postObj, getAuthorProfileFields(user));
    }
  } catch (err) {
    console.log('Error enriching post with user data in sharePostService:', err);
  }

  return postObj;
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

  // Enrich with fresh user data before returning
  const postObj = post.toObject();
  try {
    const user = await User.findById(post.author);
    if (user) {
      Object.assign(postObj, getAuthorProfileFields(user));
    }
  } catch (err) {
    console.log('Error enriching post with user data in repostService:', err);
  }

  return postObj;
};

export const removeRepostService = async (userId, postId) => {
  const post = await Post.findById(postId);
  if (!post) throw new AppError('Post not found', 404);

  const repostIndex = post.reposts.findIndex((r) => r.userId.toString() === userId.toString());
  if (repostIndex === -1) throw new AppError('You have not reposted this post', 404);

  post.reposts.splice(repostIndex, 1);
  await post.save();

  // Enrich with fresh user data before returning
  const postObj = post.toObject();
  try {
    const user = await User.findById(post.author);
    if (user) {
      Object.assign(postObj, getAuthorProfileFields(user));
    }
  } catch (err) {
    console.log('Error enriching post with user data in removeRepostService:', err);
  }

  return postObj;
};


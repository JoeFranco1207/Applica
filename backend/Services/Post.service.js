import AppError from '../Middleware/AppError.js';
import Post from '../Model/PostSchema.js';
import User from '../Model/UserSchema.js';

export const createPostService = async (userId, postData = {}) => {
  const { content, tags, media, jobId } = postData;

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

  const newPost = await Post.create({
    content: content.trim(),
    tags: sanitizedTags,
    media: postMedia,
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

  return await Post.find(filter).sort({ createdAt: -1 });
};

export const getPostByIdService = async (postId) => {
  const post = await Post.findById(postId);
  if (!post) throw new AppError('Post not found', 404);
  return post;
};

export const togglePostLikeService = async (userId, postId) => {
  const post = await Post.findById(postId);
  if (!post) throw new AppError('Post not found', 404);
  const likeIndex = post.likes.findIndex((id) => id.toString() === userId.toString());
  if (likeIndex >= 0) {
    post.likes.splice(likeIndex, 1);
  } else {
    post.likes.push(userId);
  }
  await post.save();
  return post;
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
  return post;
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

import AppSuccessful from '../Middleware/AppSuccessful.js';
import {
  createPostService,
  getAllPostsService,
  getPostByIdService,
  updatePostService,
  deletePostService,
  getPostsByAuthorService,
  togglePostLikeService,
} from '../Services/Post.service.js';

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
    return res.success(new AppSuccessful('Posts fetched successfully', 200, posts));
  } catch (err) {
    console.log(err);
    next(err);
  }
};

export const getPostController = async (req, res, next) => {
  try {
    const post = await getPostByIdService(req.params.id);
    return res.success(new AppSuccessful('Post fetched', 200, post));
  } catch (err) {
    console.log(err);
    next(err);
  }
};

export const updatePostController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const post = await updatePostService(userId, req.params.id, req.body);
    return res.success(new AppSuccessful('Post updated', 200, post));
  } catch (err) {
    console.log(err);
    next(err);
  }
};

export const deletePostController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await deletePostService(userId, req.params.id);
    return res.success(new AppSuccessful('Post deleted', 200, null));
  } catch (err) {
    console.log(err);
    next(err);
  }
};

export const getPostsByAuthorController = async (req, res, next) => {
  try {
    const posts = await getPostsByAuthorService(req.params.authorId);
    return res.success(new AppSuccessful('Author posts fetched', 200, posts));
  } catch (err) {
    console.log(err);
    next(err);
  }
};

export const togglePostLikeController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const post = await togglePostLikeService(userId, req.params.id);
    return res.success(new AppSuccessful('Post like toggled', 200, post));
  } catch (err) {
    console.log(err);
    next(err);
  }
};
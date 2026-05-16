import express from 'express';
import { protection, restrictTo } from '../Controller/ProtectionController.js';
import {
	createPostController,
	getPostsController,
	getPostController,
	updatePostController,
	deletePostController,
	getPostsByAuthorController,
	togglePostLikeController,
} from '../Controller/PostController.js';

const router = express.Router();

router.get('/', protection, getPostsController);
router.post('/', protection, restrictTo('jobseeker', 'employer'), createPostController);

router.get('/:id', protection, getPostController);
router.patch('/:id', protection, updatePostController);
router.delete('/:id', protection, deletePostController);
router.post('/:id/like', protection, togglePostLikeController);

router.get('/author/:authorId', protection, getPostsByAuthorController);

export default router;

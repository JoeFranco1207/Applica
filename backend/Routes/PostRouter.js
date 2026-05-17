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
	addCommentController,
	deleteCommentController,
	addReplyController,
	recordViewController,
	sharePostController,
	repostController,
	removeRepostController,
} from '../Controller/PostController.js';

const router = express.Router();

router.get('/', protection, getPostsController);
router.post('/', protection, restrictTo('jobseeker', 'employer'), createPostController);

router.get('/author/:authorId', protection, getPostsByAuthorController);
router.post('/:id/like', protection, togglePostLikeController);
router.post('/:id/comment', protection, addCommentController);
router.delete('/:id/comment/:commentId', protection, deleteCommentController);
router.post('/:id/comment/:commentId/reply', protection, addReplyController);
router.post('/:id/view', protection, recordViewController);
router.post('/:id/share', protection, sharePostController);
router.post('/:id/repost', protection, repostController);
router.delete('/:id/repost', protection, removeRepostController);
router.get('/:id', protection, getPostController);
router.patch('/:id', protection, updatePostController);
router.delete('/:id', protection, deletePostController);

export default router;

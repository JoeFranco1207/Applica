import express from "express";
import { protection, restrictTo } from "../Controller/ProtectionController.js";
import {
  getJobsController,
  addJobViewController,
  addJobCommentController,
  toggleJobLikeController,
  applyToJobController,
  getJobByIdController,
} from "../Controller/JobsController.js";

const router = express.Router();

router.get("/", getJobsController);
router.get("/:jobId", getJobByIdController);
router.post("/:jobId/view", protection, restrictTo("jobseeker"), addJobViewController);
router.post("/:jobId/comment", protection, addJobCommentController);
router.post("/:jobId/like", protection, restrictTo("jobseeker"), toggleJobLikeController);
router.post("/:jobId/apply", protection, restrictTo("jobseeker"), applyToJobController);

export default router;

import AppSuccessful from "../Middleware/AppSuccessful.js";
import { createJob } from "../Services/CreateJob.service.js";

export const createJobController = async (req, res, next) => {
  try {
    const employerId = req.user.id;

    const job = await createJob(req.body, employerId);

    return res.status(201).json(
      new AppSuccessful("Created Job Successfully", 201, job)
    );
  } catch (err) {
    console.log(err);
    next(err);
  }
};
import { jobseekerProfileService, updateJobseekerProfileService } from "../Services/CreateJobseekerProfile.service.js";
import AppSuccessful from '../Middleware/AppSuccessful.js'
import AppError from '../Middleware/AppError.js';

export const jobseekerProfile = async (req, res, next) => {
  try {
    const response = await jobseekerProfileService(req.User.id, req.body);
    return res.success(new AppSuccessful("Jobseeker profile created successfully", 201, response));

  } catch (err) {
    console.log(err);
    return next(err);
  }
};



export const updateJobseekerProfile = async (req, res, next) => {
    try{
    const response = await updateJobseekerProfileService(req.User.id, req.body);
    return res.success(new AppSuccessful("Jobseeker profile updated successfully", 200, response));
   }catch(err){
    console.log(err);
    return next(err);
    } 
}
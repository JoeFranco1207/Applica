import { jobseekerProfileService, updateJobseekerProfileService } from "../Services/CreateJobseekerProfile.service.js";
import AppSuccessful from '../Middleware/AppSuccessful.js'
import { createResumeService } from "../Services/CreateResume.service.js";
import AppError from '../Middleware/AppError.js';
import path from 'path';
import fs from 'fs';
import User from '../Model/UserSchema.js';

export const jobseekerProfile = async (req, res, next) => {
  try {
    const response = await jobseekerProfileService(req.user.id, req.body);
    return res.success(new AppSuccessful("Jobseeker profile created successfully", 201, response));

  } catch (err) {
    console.log(err);
    return next(err);
  }
};



export const updateJobseekerProfile = async (req, res, next) => {
  try {
    const response = await updateJobseekerProfileService(req.user.id, req.body);
    return res.success(new AppSuccessful("Jobseeker profile updated successfully", 200, response));
  } catch (err) {
    console.log(err);
    return next(err);
  }
};

export const createResumeController = async (req, res, next) => {
  try {
    const result = await createResumeService(req.user.id, req.body);

    // If route includes a fileName param, respond with raw PDF attachment
    if (req.params?.fileName) {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${result.fileName}"`
      );
      return res.send(result.pdfBuffer);
    }

    // Default: return JSON with public URL for frontend
    return res.status(201).json({
      ok: true,
      fileName: result.fileName,
      url: result.publicUrl,
    });

  } catch (err) {
    next(err);
  }
};

export const uploadResumeController = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    // Build public URL for stored resume
    const publicUrlBase = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 8000}`;
    const publicPath = `/uploads/resumes/${req.file.filename}`;
    const publicUrl = `${publicUrlBase}${publicPath}`;

    // Attach resume URL to user profile
    const user = await User.findById(req.user.id);
    if (!user) throw new AppError('User not found', 404);
    user.resume = publicUrl;
    user.resumes = user.resumes || [];
    user.resumes = user.resumes.map((item) => ({ ...item, default: false }));
    user.resumes.push({
      fileName: req.file.filename,
      url: publicUrl,
      uploadedAt: new Date(),
      default: true,
    });
    await user.save();

    return res.status(201).json({ ok: true, url: publicUrl, fileName: req.file.filename, resumes: user.resumes });
  } catch (err) {
    next(err);
  }
};
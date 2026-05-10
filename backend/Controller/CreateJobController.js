import AppSuccessful from "../Middleware/AppSuccessful.js";
import { createJob } from "../Services/CreateJob.service.js";

export const createResumeController = async (req, res, next) => {
  try {
    const fileNameFromUrl = req.params.fileName;

    const result = await createResumeService(
      req.user.id,
      req.body,
      fileNameFromUrl
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${result.fileName}"`
    );

    return res.send(result.pdfBuffer);

  } catch (err) {
    next(err);
  }
};
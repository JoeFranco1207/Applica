import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema({
  jobseeker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  fileName: {
    type: String,
    required: true
  },

  filePath: {
    type: String,
    required: true
  },

  education: [
    {
      degree: String,
      institution: String,
      year: String
    }
  ],

  experience: [
    {
      position: String,
      company: String,
      years: String,
      description: String
    }
  ],

  skills: [String],

  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Resume", resumeSchema);
import mongoose, { setDriver } from "mongoose";

const applicantSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  resume: {
    type: String,
  },
  coverLetter: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ["pending", "reviewing", "interview", "accepted", "rejected"],
    default: "pending",
  },
  appliedAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  rejectedAt: {
    type: Date,
  },
});

export const jobSchema = new mongoose.Schema({
    title:{
        type: String,
        required: true
    },
    description:{
        type: String,
        required: true,
    },
    requirements:{
        type: String,
        required: true
    },
    responsibilities: String,
    qualifications: String,
    benefits: String,
    companyName:{
         type: String,
         required: true
    },
    location: String,
    employmentType: {
      type: String,
      enum: ["Full-time", "Part-time", "Internship", "Freelance", "Contract"],
      default: "Full-time",
    },
    remoteType: {
      type: String,
      enum: ["Remote", "On-site", "Hybrid"],
      default: "Remote",
    },
    salary: Number,
    salaryMin: Number,
    salaryMax: Number,
    salaryFrequency: {
      type: String,
      enum: ["monthly", "yearly", "weekly", "daily", "one-time"],
      default: "monthly"
    },
    externalLink: String,
    media: {
      type: {
        type: String,
        enum: ["image", "video"],
      },
      data: String,
      contentType: String,
      fileName: String,
    },
    mediaFiles: {
      type: [
        {
          type: {
            type: String,
            enum: ["image", "video"],
          },
          data: String,
          contentType: String,
          fileName: String,
        },
      ],
      default: [],
    },
    views: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    likes: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    applicants: {
      type: [applicantSchema],
      default: [],
    },
    comments: {
      type: [
        {
          author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
          authorName: String,
          authorAvatar: String,
          content: { type: String, required: true, trim: true },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    expiresAt: {
      type: Date,
      default: undefined,
    },
    postPlan: {
      type: String,
      enum: ['free', 'premium'],
      default: 'free',
    },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, {
  timestamps: true
});
 
export default mongoose.model("Job", jobSchema);

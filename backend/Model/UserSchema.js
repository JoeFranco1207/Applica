import mongoose from 'mongoose';

const options = {
  discriminatorKey: 'role',
  timestamps: true,
};

const normalizePlan = (plan) => {
  if (!plan) return '';
  if (typeof plan !== 'string') plan = String(plan);
  return plan.startsWith('employer_') ? plan.replace(/^employer_/, '') : plan;
};

const userSchema = new mongoose.Schema({
  //Basic User Information
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    middleName: {type: String, default: ""},
    email: { type: String,required: true, }, 
    password:{ type: String,required: true },
    phoneNumber: String,
    profilePicture: { type: String, default: '' },
    companyLogo: { type: String, default: '' },
    bio: { type: String, default: '' },
    citizenShip: { type: String, default: '' },
    location: {
      region: { type: String, default: '' },
      city: { type: String, default: '' },
      barangay: { type: String, default: '' },
      otherDetails: { type: String, default: '' },
      coords: {
        lat: Number,
        lng: Number,
      },
    },
    experience: { type: String, default: '' },
    education: { type: String, default: '' },
    resume: { type: String, default: '' },
    skills: {
      type: [String],
      default: [],
    },
    certifications: {
      type: [String],
      default: [],
    },
    portfolioLinks: {
      type: [String],
      default: [],
    },
    socialLinks: {
      github: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      twitter: { type: String, default: '' },
    },
    role: { type: String,
      enum: ['user', 'admin', 'employer', 'jobseeker'],
      default: 'user' },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationCode: {
      type: Number,
      select: false,
    },

    verificationCodeValidation: {
      type: Number,
      select: false,
    },
    codeExpiration: {
      type: Date,
      select: false,
    },
    activeSessionToken: {
      type: String,
      select: false,
      default: null,
    },
    activeSessionDevice: {
      type: String,
      default: "",
    },
    activeSessionExpires: {
      type: Date,
      default: null,
    },
    sessions: [
      {
        token: { type: String },
        device: { type: String, default: '' },
        createdAt: { type: Date, default: Date.now },
        expires: { type: Date },
      },
    ],
    connections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    
    // Presence information
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastActive: {
      type: Date,
      default: null,
    },
    presenceMode: {
      type: String,
      enum: ['online', 'offline', 'dnd'],
      default: 'offline',
    },
    premiumAIAccess: {
      type: Boolean,
      default: false,
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    suspensionReason: {
      type: String,
      default: '',
    },
    suspensionExpires: {
      type: Date,
      default: null,
    },
    refundHistory: [
      {
        amountCents: { type: Number, default: 0 },
        reason: { type: String, default: '' },
        admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    // Allow one free interview scheduling trial per account
    interviewTrialUsed: {
      type: Boolean,
      default: false,
    },
    premiumPlan: {
      type: String,
      enum: ['monthly', 'halfYearly', 'annual', ''],
      default: '',
      set: (v) => normalizePlan(v),
    },
    // Transient: store the last created PayMongo source id for AI premium
    lastAIPaymentSource: {
      type: String,
      default: '',
      select: false,
    },
    lastAIPaymentPhone: {
      type: String,
      default: '',
      select: false,
    },
    lastAIPaymentPlan: {
      type: String,
      enum: ['monthly', 'halfYearly', 'annual', ''],
      default: '',
      select: false,
      set: (v) => normalizePlan(v),
    },
    forgotPasswordCode: {
      type: Number,
      select: false,
    },
    
  }, options
 );

export default mongoose.model("User", userSchema);



     
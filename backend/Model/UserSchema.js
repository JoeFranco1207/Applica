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
      province: { type: String, default: '' },
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
      facebook: { type: String, default: '' },
      instagram: { type: String, default: '' },
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
    activeSessionLocation: {
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
        location: { type: String, default: '' },
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
    
    // Privacy & Settings
    profileVisibility: {
      type: String,
      enum: ['public', 'private', 'connections'],
      default: 'public',
    },
    showActivityStatus: {
      type: Boolean,
      default: true,
    },
    allowMessages: {
      type: Boolean,
      default: true,
    },
    showProfileInSearch: {
      type: Boolean,
      default: true,
    },
    jobAlerts: {
      type: Boolean,
      default: true,
    },
    applicationUpdates: {
      type: Boolean,
      default: true,
    },
    jobRecommendations: {
      type: Boolean,
      default: true,
    },
    interviewRequests: {
      type: Boolean,
      default: true,
    },
    messages: {
      type: Boolean,
      default: true,
    },
    marketingTips: {
      type: Boolean,
      default: false,
    },
    pushNotifications: {
      type: Boolean,
      default: true,
    },
    soundEffects: {
      type: Boolean,
      default: true,
    },
    vibration: {
      type: Boolean,
      default: true,
    },
    emailDigest: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'never'],
      default: 'weekly',
    },
    themePreference: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light',
    },
    languagePreference: {
      type: String,
      enum: ['en', 'es', 'fil'],
      default: 'en',
    },
    compactView: {
      type: Boolean,
      default: false,
    },
    fontSize: {
      type: String,
      enum: ['small', 'normal', 'large', 'extra-large'],
      default: 'normal',
    },
    animationsEnabled: {
      type: Boolean,
      default: true,
    },
    connectedAccounts: {
      linkedin: { type: Boolean, default: false },
      github: { type: Boolean, default: false },
      google: { type: Boolean, default: false },
      facebook: { type: Boolean, default: false },
    },
    supportTickets: [
      {
        ticketId: { type: String, required: true },
        subject: { type: String, required: true },
        message: { type: String, default: '' },
        status: {
          type: String,
          enum: ['open', 'pending', 'closed'],
          default: 'open',
        },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
    billingHistory: [
      {
        plan: { type: String, default: '' },
        amountCents: { type: Number, default: 0 },
        currency: { type: String, default: 'USD' },
        status: { type: String, default: 'completed' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    resumes: [
      {
        fileName: { type: String, default: '' },
        url: { type: String, default: '' },
        uploadedAt: { type: Date, default: Date.now },
        default: { type: Boolean, default: false },
      },
    ],
    // Track how many resumes a non-premium user has generated via the builder
    resumeGenerationCount: {
      type: Number,
      default: 0,
    },
    savedSearches: {
      type: [String],
      default: [],
    },
  }, options
 );

// Ensure legacy string `location` fields are normalized to the object shape before saving
userSchema.pre('save', function () {
  if (this.location == null || typeof this.location === 'string') {
    this.location = {
      region: '',
      city: '',
      barangay: '',
      otherDetails: '',
      coords: { lat: null, lng: null },
    };
  }
});

export default mongoose.model("User", userSchema);



     
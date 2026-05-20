import mongoose from 'mongoose';

const options = {
  discriminatorKey: 'role',
  timestamps: true,
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

    forgotPasswordCode: {
      type: Number,
      select: false,
    },
    
  }, options
 );

export default mongoose.model("User", userSchema);



     
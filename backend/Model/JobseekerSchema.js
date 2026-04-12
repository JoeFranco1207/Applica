import mongoose from 'mongoose';
import User from './UserSchema.js';
 
export const  jobseekerSchema = new mongoose.Schema({
      
      profilePicture: String,
      bio: String,

    citizenShip:{
      type: String,
      required: true,
      enum: ["Filipino", "Foreign"]
    },

    location:{ 

      region:{
        type: String,
        required: true
      },
      city:{
        type: String,
        required: true
      },
      barangay:{
        type: String,
        required: true
      },
      otherDetails: String
    },

    experience: String,
    education: String,
},
 {
    timestamps: true,
 }
);

export default User.discriminator("jobseeker", jobseekerSchema);
 
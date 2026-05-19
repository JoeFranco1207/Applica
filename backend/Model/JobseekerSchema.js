import mongoose from 'mongoose';
import User from './UserSchema.js';
 
export const  jobseekerSchema = new mongoose.Schema({
      
      profilePicture: String,
      bio: String,
      
    citizenShip:{
      type: String,
      enum: ["Filipino", "Foreign"],
      default: "Filipino"
    },
         
    location:{ 

      region:{
        type: String,
      },
      city:{
        type: String,
      },
      barangay:{
        type: String,
      },
      otherDetails: String,
      coords: {
        lat: Number,
        lng: Number
      }
    },

    experience: String,
    education: String,
    resume: {
      type: String,
    }
},
 {
    timestamps: true,
 }
);

export default User.discriminator("jobseeker", jobseekerSchema);
 
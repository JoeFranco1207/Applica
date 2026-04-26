import mongoose from 'mongoose';
import User from './UserSchema.js';

export const employerSchema = new mongoose.Schema({
    companyName: { type: String, required: true },
    companyDescription: String,
    companyLocation: {
        region: String,
        city: String,
        barangay: String,
        otherDetails: String
    },
    companySize: {
        type: String,
        enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1001+"]
    },
    industry: String,
    website: String,
    contactNumber: String,
    companyLogo: String,
    dateEstablished: Date,
    dateOfApproval: Date,
    approvalStatus: {
        type: String,
        enum: ["pending", "approved", "rejected"]
    }
}, {
    timestamps: true,
 }
 
);

const Employer = User.discriminator("employer", employerSchema);
export default Employer;
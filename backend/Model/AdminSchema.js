import mongoose from "mongoose";
import User from "./UserSchema.js";

export const adminSchema = new mongoose.Schema({
    adminCode: { type: String, required: true },
 permissions: {
  type: [String],
  default: []
 }
},
 {
    timestamps: true,
 }

);

export default User.discriminator("admin", adminSchema);
import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  adminCode: { type: String, required: true },
  permissions: {
  type: [String],
  default: [
    "EMPLOYER_APPROVE",
    "EMPLOYER_REJECT",
    "EMPLOYER_VIEW_ALL",
    "EMPLOYER_DELETE"
  ]
}
}, {
  timestamps: true
});

export default mongoose.model("Admin", adminSchema);
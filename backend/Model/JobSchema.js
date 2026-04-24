import mongoose from "mongoose";

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
    companyName:{
         type: String,
         required: true
    },
    location: String,
     salary: Number,

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, {
  timestamps: true
});


export default mongoose.model("job", jobSchema);

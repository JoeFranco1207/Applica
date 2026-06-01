import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: {
      type: String,
      enum: ['post', 'user', 'employer', 'message', 'job'],
      required: true,
    },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    targetOwner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String, default: 'Reported for review' },
    details: { type: String, default: '' },
    status: {
      type: String,
      enum: ['open', 'reviewed', 'dismissed', 'actioned'],
      default: 'open',
    },
    actionTaken: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Report', reportSchema);

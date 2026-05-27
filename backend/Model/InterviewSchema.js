import mongoose from 'mongoose';

const { Schema } = mongoose;

const ParticipantSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['applicant', 'employer'], default: 'applicant' },
  accepted: { type: Boolean, default: false }
}, { _id: false });

const InterviewSchema = new Schema({
  employer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: 'Interview' },
  description: { type: String, default: '' },
  participants: { type: [ParticipantSchema], default: [] },
  scheduledAt: { type: Date, required: true },
  location: { type: String, default: '' },
  roomId: { type: String, required: true, unique: true },
  status: { type: String, enum: ['pending', 'scheduled', 'cancelled', 'completed'], default: 'pending' }
}, { timestamps: true });

export default mongoose.model('Interview', InterviewSchema);

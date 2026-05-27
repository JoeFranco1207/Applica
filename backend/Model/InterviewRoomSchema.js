import mongoose from 'mongoose';

const { Schema } = mongoose;

const ParticipantSessionSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  socketId: { type: String, required: true },
  role: { type: String, enum: ['employer', 'applicant'], default: 'applicant' },
  status: { type: String, enum: ['waiting', 'in-room', 'left'], default: 'waiting' },
  isScreenSharing: { type: Boolean, default: false },
  audioEnabled: { type: Boolean, default: true },
  videoEnabled: { type: Boolean, default: true },
  joinedAt: { type: Date, default: Date.now },
  leftAt: { type: Date }
}, { _id: false });

const InterviewRoomSchema = new Schema({
  roomId: { type: String, required: true, unique: true },
  interview: { type: Schema.Types.ObjectId, ref: 'Interview', required: true },
  employer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  participants: { type: [ParticipantSessionSchema], default: [] },
  status: { type: String, enum: ['waiting', 'active', 'ended'], default: 'waiting' },
  startedAt: { type: Date },
  endedAt: { type: Date },
  recordingUrl: { type: String },
  isRecording: { type: Boolean, default: false }
}, { timestamps: true });

// Index for quick room lookups
InterviewRoomSchema.index({ roomId: 1 });
InterviewRoomSchema.index({ interview: 1 });
InterviewRoomSchema.index({ employer: 1 });

export default mongoose.model('InterviewRoom', InterviewRoomSchema);

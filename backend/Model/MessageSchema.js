import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      trim: true,
      default: '',
    },
    linkUrl: {
      type: String,
      trim: true,
    },
    attachment: {
      fileName: String,
      fileUrl: String,
      mimeType: String,
    },
    system: {
      type: Boolean,
      default: false,
    },
    callInfo: {
      mode: {
        type: String,
        enum: ['audio', 'video'],
        default: 'audio',
      },
      durationMs: Number,
      endedById: String,
      endedBy: String,
      note: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Message', messageSchema);

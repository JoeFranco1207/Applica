import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },
    tags: [String],
    media: {
      type: {
        type: String,
        enum: ['image', 'video'],
      },
      data: String,
      contentType: String,
      fileName: String,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    authorName: String,
    authorRole: String,
    authorAvatar: String,
    location: {
      region: String,
      city: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    archived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Post', postSchema);

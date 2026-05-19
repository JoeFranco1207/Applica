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
    comments: [
      {
        _id: mongoose.Schema.Types.ObjectId,
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        authorName: String,
        authorAvatar: String,
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        replies: [
          {
            _id: mongoose.Schema.Types.ObjectId,
            author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            authorName: String,
            authorAvatar: String,
            content: { type: String, required: true },
            createdAt: { type: Date, default: Date.now },
          },
        ],
      },
    ],
    views: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    shares: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        sharedAt: { type: Date, default: Date.now },
      },
    ],
    reposts: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        repostedAt: { type: Date, default: Date.now },
      },
    ],
    archived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

postSchema.index({ author: 1, createdAt: -1 });

export default mongoose.model('Post', postSchema);

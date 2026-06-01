import mongoose from 'mongoose';

const appConfigSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, default: null },
    metadata: { type: Object, default: {} },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('AppConfig', appConfigSchema);

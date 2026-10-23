import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ['NURSE', 'DOCTOR', 'ADMIN', 'DIRECTOR'],
      required: true,
      index: true,
    },
    title: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    demoPersona: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const User = mongoose.model('User', userSchema);

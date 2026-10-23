import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    number: { type: Number, required: true, unique: true, index: true },
    ward: {
      type: String,
      enum: ['A', 'B', 'C', 'D'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'OCCUPIED'],
      default: 'AVAILABLE',
      index: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      default: null,
    },
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

export const Room = mongoose.model('Room', roomSchema);

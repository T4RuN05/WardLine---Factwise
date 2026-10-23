import mongoose from 'mongoose';

const deathRecordSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      unique: true,
      index: true,
    },
    occurredAt: { type: Date, required: true },
    recordedAt: { type: Date, default: Date.now },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recordedByName: { type: String, default: '' },
    causeNote: { type: String, required: true, trim: true },
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

export const DeathRecord = mongoose.model('DeathRecord', deathRecordSchema);

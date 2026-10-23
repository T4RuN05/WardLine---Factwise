import mongoose from 'mongoose';

const dischargeRecordSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    eligibleOn: { type: String, required: true, index: true }, // YYYY-MM-DD
    approvedAt: { type: Date, default: null },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedByName: { type: String, default: null },
    revokedAt: { type: Date, default: null },
    revokedReason: { type: String, default: null },
    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    completedAt: { type: Date, default: null },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    completedByName: { type: String, default: null },
    history: [
      {
        at: { type: Date, default: Date.now },
        action: { type: String, required: true },
        actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        actorName: { type: String },
        note: { type: String },
      },
    ],
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

dischargeRecordSchema.index({ patientId: 1, eligibleOn: 1 });

export const DischargeRecord = mongoose.model('DischargeRecord', dischargeRecordSchema);

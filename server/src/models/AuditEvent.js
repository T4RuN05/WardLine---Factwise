import mongoose from 'mongoose';

const auditEventSchema = new mongoose.Schema(
  {
    at: { type: Date, default: Date.now, index: true },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    actorName: { type: String, default: 'System' },
    actorRole: {
      type: String,
      enum: ['NURSE', 'DOCTOR', 'ADMIN', 'DIRECTOR', 'SYSTEM'],
      required: true,
      index: true,
    },
    action: { type: String, required: true, index: true },
    entity: { type: String, required: true, index: true },
    entityId: { type: String, default: null },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      default: null,
      index: true,
    },
    patientName: { type: String, default: null },
    summary: { type: String, required: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
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

export const AuditEvent = mongoose.model('AuditEvent', auditEventSchema);

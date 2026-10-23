import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema(
  {
    mrn: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 0, max: 120 },
    sex: { type: String, enum: ['M', 'F', 'OTHER'], required: true },
    phone: { type: String, required: true, trim: true },
    emergencyContact: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      relationship: { type: String, default: 'Family' },
    },
    admittedOn: { type: String, required: true, index: true }, // YYYY-MM-DD
    admittedAt: { type: Date, default: Date.now },
    admittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      default: null,
      index: true,
    },
    roomNumber: { type: Number, default: null },
    status: {
      type: String,
      enum: ['ADMITTED', 'DISCHARGE_APPROVED', 'DISCHARGED', 'DECEASED'],
      default: 'ADMITTED',
      index: true,
    },
    closedOn: { type: String, default: null, index: true }, // YYYY-MM-DD
    closedAt: { type: Date, default: null },
    notes: { type: String, default: '' },
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

export const Patient = mongoose.model('Patient', patientSchema);

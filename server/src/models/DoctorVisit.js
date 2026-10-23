import mongoose from 'mongoose';

const doctorVisitSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    date: { type: String, required: true, index: true }, // YYYY-MM-DD
    visitedAt: { type: Date, default: Date.now },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    temperatureReadingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TemperatureReading',
      required: true,
    },
    clinicalStatus: {
      type: String,
      enum: ['STABLE', 'IMPROVING', 'WORSENING', 'CRITICAL'],
      required: true,
    },
    notes: { type: String, required: true, trim: true },
    treatmentPlan: { type: String, default: '' },
    addenda: [
      {
        at: { type: Date, default: Date.now },
        doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        doctorName: { type: String, default: '' },
        text: { type: String, required: true },
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

// One primary visit per patient per facility date (VIS-3)
doctorVisitSchema.index({ patientId: 1, date: 1 }, { unique: true });

export const DoctorVisit = mongoose.model('DoctorVisit', doctorVisitSchema);

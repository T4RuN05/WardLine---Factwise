import mongoose from 'mongoose';

const temperatureReadingSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    date: { type: String, required: true, index: true }, // YYYY-MM-DD
    recordedAt: { type: Date, default: Date.now },
    valueC: { type: Number, required: true },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recordedByRole: {
      type: String,
      enum: ['NURSE', 'DOCTOR'],
      required: true,
    },
    isFever: { type: Boolean, required: true, index: true },
    isCritical: { type: Boolean, required: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
    supersededBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TemperatureReading',
      default: null,
    },
    correctionReason: { type: String, default: null },
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

// Compound unique partial index: exactly one active reading per patient per facility day (TMP-2)
temperatureReadingSchema.index(
  { patientId: 1, date: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);

export const TemperatureReading = mongoose.model('TemperatureReading', temperatureReadingSchema);

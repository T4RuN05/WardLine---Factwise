import mongoose from 'mongoose';

const facilitySettingsSchema = new mongoose.Schema(
  {
    facilityName: {
      type: String,
      default: 'WardLine Quarantine & Treatment Centre',
    },
    capacity: { type: Number, default: 74 },
    feverThresholdC: { type: Number, default: 38.0 },
    criticalThresholdC: { type: Number, default: 40.0 },
    requiredFeverFreeDays: { type: Number, default: 3 },
    mortalityBenchmark: { type: Number, default: 0.15 },
    mortalityWarningRatio: { type: Number, default: 0.12 },
    minClosedCasesForAlert: { type: Number, default: 20 },
    requireDoctorApproval: { type: Boolean, default: true },
    approvedNotDischargedSlaHours: { type: Number, default: 4 },
    facilityTimezone: { type: String, default: 'Asia/Kolkata' },
    demoClockNow: { type: Date, default: null },
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

export const FacilitySettings = mongoose.model('FacilitySettings', facilitySettingsSchema);

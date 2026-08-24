import mongoose from 'mongoose';

const emergencySchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Emergency must belong to a user'],
    },
    helper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    type: {
      type: String,
      required: [true, 'Please specify the emergency type'],
      enum: ['Medical', 'Transportation', 'Fire', 'Accident', 'Crime/Safety', 'Natural Disaster', 'Other'],
      default: 'Other',
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: {
        type: [Number],
        required: [true, 'Emergency location coordinates are required'],
      },
      address: { type: String, trim: true },
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'HIGH',
    },
    status: {
        type: String,
        enum: ['SEARCHING', 'ASSIGNED', 'ON_THE_WAY', 'ARRIVED', 'RESOLVED', 'CLOSED', 'CANCELED'],
        default: 'SEARCHING'
    },
    chat: [
      {
        senderId: { type: String, required: true },
        text: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
      }
    ],
    acceptedAt: { type: Date, default: null },
    arrivedAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

emergencySchema.index({ location: '2dsphere' });
emergencySchema.index({ status: 1, createdAt: -1 });
emergencySchema.index({ createdBy: 1, status: 1 });
emergencySchema.index({ helper: 1, status: 1 });

// 🟢 THE FIX: TTL Index to auto-delete abandoned searches after 2 hours (7200 seconds)
emergencySchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 7200, partialFilterExpression: { status: "SEARCHING" } }
);

const Emergency = mongoose.model('Emergency', emergencySchema);
export default Emergency;
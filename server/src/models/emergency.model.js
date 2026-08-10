import mongoose from 'mongoose';

const emergencySchema = new mongoose.Schema(
  {
    // The user who reported/needs help
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Emergency must belong to a user'],
    },

    // The user who accepted to help (Starts null, filled when someone clicks "I CAN HELP")
    helper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    type: {
      type: String,
      required: [true, 'Please specify the emergency type'],
      enum: [
        'Medical',
        'Transportation',
        'Fire',
        'Accident',
        'Crime/Safety',
        'Natural Disaster',
        'Other',
      ],
      default: 'Other',
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    // GeoJSON for location-based query support ($near, $geoWithin)
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      // [longitude, latitude] Note: MongoDB requires Longitude FIRST
      coordinates: {
        type: [Number],
        required: [true, 'Emergency location coordinates are required'],
      },
      address: {
        type: String,
        trim: true,
      },
    },

    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'HIGH',
    },

    // The strict lifecycle state machine
    status: {
      type: String,
      enum: [
        'REPORTED',
        'SEARCHING',
        'HELPER_ASSIGNED',
        'ON_THE_WAY',
        'ARRIVED',
        'RESOLVED',
        'CLOSED',
      ],
      default: 'REPORTED',
    },

    // Optional media attached to emergency (Cloudinary URL)
    imageUrl: {
      type: String,
      default: null,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// Create 2dsphere index for fast nearby emergency searches
emergencySchema.index({ location: '2dsphere' });

// Create indexes on common query combinations
emergencySchema.index({ status: 1, createdAt: -1 });
emergencySchema.index({ createdBy: 1, status: 1 });
emergencySchema.index({ helper: 1, status: 1 });

const Emergency = mongoose.model('Emergency', emergencySchema);

export default Emergency;
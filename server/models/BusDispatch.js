const mongoose = require('mongoose');

const busDispatchSchema = new mongoose.Schema(
  {
    dispatchManifestNumber: {
      type: String,
      unique: true,
      required: true,
    },
    busNumber: {
      type: String,
      required: [true, 'Bus number is required'],
      trim: true,
      uppercase: true,
    },
    busName: {
      type: String,
      trim: true,
      default: '',
    },
    operator: {
      type: String,
      trim: true,
      default: 'Express Line',
    },
    route: {
      type: String,
      trim: true,
      default: '',
    },
    fromCity: {
      type: String,
      trim: true,
      default: '',
    },
    toCity: {
      type: String,
      trim: true,
      default: '',
    },
    originAddress: {
      type: String,
      trim: true,
      default: '',
    },
    destinationAddress: {
      type: String,
      trim: true,
      default: '',
    },
    driverName: {
      type: String,
      trim: true,
      default: '',
    },
    driverPhone: {
      type: String,
      trim: true,
      default: '',
    },
    alternatePhone: {
      type: String,
      trim: true,
      default: '',
    },
    departureTime: {
      type: String,
      required: [true, 'Departure time is required'],
      trim: true,
    },
    arrivalTime: {
      type: String,
      trim: true,
      default: '',
    },
    platformNumber: {
      type: String,
      trim: true,
      default: '',
    },
    bookingIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
      },
    ],
    orderIds: [
      {
        type: String,
      },
    ],
    totalParcels: {
      type: Number,
      default: 0,
    },
    totalWeight: {
      type: Number,
      default: 0,
    },
    dispatchNotes: {
      type: String,
      trim: true,
      default: '',
    },
    dispatchedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    dispatchedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['DISPATCHED', 'COMPLETED', 'CANCELLED'],
      default: 'DISPATCHED',
    },
  },
  {
    timestamps: true,
  }
);

busDispatchSchema.index({ dispatchedAt: -1 });
busDispatchSchema.index({ busNumber: 1 });

module.exports = mongoose.model('BusDispatch', busDispatchSchema);

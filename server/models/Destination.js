const mongoose = require('mongoose');

const destinationSchema = new mongoose.Schema(
  {
    route: {
      type: String,
      required: [true, 'Destination route is required'],
      trim: true,
      unique: true,
      index: true,
    },
    fromCity: {
      type: String,
      trim: true,
      default: 'Hyderabad',
    },
    toCity: {
      type: String,
      trim: true,
      default: '',
    },
    deliveryAddress: {
      type: String,
      trim: true,
      default: '',
    },
    collectionPoints: {
      type: [String],
      default: [],
    },
    receiverName: {
      type: String,
      trim: true,
      default: '',
    },
    receiverPhone: {
      type: String,
      trim: true,
      default: '',
    },
    standardCharge: {
      type: Number,
      default: 0,
      min: 0,
    },
    dispatchSchedule: {
      type: String,
      trim: true,
      default: '',
    },
    active: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Destination', destinationSchema);

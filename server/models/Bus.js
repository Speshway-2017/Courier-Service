const mongoose = require('mongoose');

const busSchema = new mongoose.Schema(
  {
    busNumber: {
      type: String,
      required: [true, 'Bus registration number is required (e.g. AP 39 CN 3580)'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    busName: {
      type: String,
      trim: true,
      default: '',
    },
    operator: {
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
    route: {
      type: String,
      trim: true,
      default: '',
    },
    defaultDepartureTime: {
      type: String,
      trim: true,
      default: '',
    },
    defaultArrivalTime: {
      type: String,
      trim: true,
      default: '',
    },
    platformNumber: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Bus', busSchema);

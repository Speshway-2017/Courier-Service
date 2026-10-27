const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Driver name is required (e.g. Ramesh Kumar)'],
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Driver primary mobile number is required'],
      trim: true,
      index: true,
    },
    alternatePhone: {
      type: String,
      trim: true,
      default: '',
    },
    licenseNumber: {
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

module.exports = mongoose.model('Driver', driverSchema);

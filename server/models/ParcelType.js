const mongoose = require('mongoose');

const parcelTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Parcel type name is required'],
      unique: true,
      trim: true,
      index: true,
    },
    defaultCharge: {
      type: Number,
      default: 0,
      min: 0,
    },
    defaultWeight: {
      type: Number,
      default: 0,
      min: 0,
    },
    description: {
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

module.exports = mongoose.model('ParcelType', parcelTypeSchema);

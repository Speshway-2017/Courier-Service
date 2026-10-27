const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
      match: [/^\d{6}$/, 'Order ID must be a 6-digit number'],
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    customerPhone: {
      type: String,
      required: [true, 'Customer mobile number is required'],
      trim: true,
    },
    customerWhatsapp: {
      type: String,
      trim: true,
      default: '',
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
      required: [true, 'Delivery address is required'],
      trim: true,
    },
    destination: {
      type: String,
      required: [true, 'Destination location is required'],
      trim: true,
      index: true,
    },
    parcelType: {
      type: String,
      required: [true, 'Parcel type is required'],
      trim: true,
      default: 'Box',
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    weight: {
      type: Number, // in kg
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    amount: {
      type: Number,
      required: [true, 'Delivery charge is required'],
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['PAID', 'TO_PAY_ON_DELIVERY', 'PENDING'],
      default: 'PAID',
    },
    status: {
      type: String,
      enum: ['BOOKED', 'WAITING_FOR_BUS', 'DISPATCHED', 'DELIVERED', 'CANCELLED'],
      default: 'WAITING_FOR_BUS',
      index: true,
    },
    busDetails: {
      busNumber: { type: String, trim: true, default: '' },
      busName: { type: String, trim: true, default: '' },
      operator: { type: String, trim: true, default: '' },
      route: { type: String, trim: true, default: '' },
      fromCity: { type: String, trim: true, default: '' },
      toCity: { type: String, trim: true, default: '' },
      originAddress: { type: String, trim: true, default: '' },
      destinationAddress: { type: String, trim: true, default: '' },
      driverName: { type: String, trim: true, default: '' },
      driverPhone: { type: String, trim: true, default: '' },
      alternatePhone: { type: String, trim: true, default: '' },
      departureTime: { type: String, trim: true, default: '' },
      arrivalTime: { type: String, trim: true, default: '' },
      platformNumber: { type: String, trim: true, default: '' },
      dispatchNotes: { type: String, trim: true, default: '' },
      dispatchedAt: { type: Date },
      dispatchedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    timeline: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        description: { type: String },
        updatedBy: { type: String },
      },
    ],
    notificationStatus: {
      type: String,
      enum: ['NOT_SENT', 'SENT', 'FAILED'],
      default: 'NOT_SENT',
    },
    notificationSentAt: {
      type: Date,
    },
    lastNotificationMessage: {
      type: String,
    },
    deliveredAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    branch: {
      type: String,
      default: 'Main Office',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast lookup and search
bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ status: 1, createdAt: -1 });
bookingSchema.index({ customerPhone: 1 });
bookingSchema.index({ 'busDetails.busNumber': 1 });

module.exports = mongoose.model('Booking', bookingSchema);

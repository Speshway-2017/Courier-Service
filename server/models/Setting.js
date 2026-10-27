const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      default: 'FastTrack Bus Parcel & Courier Services',
    },
    logoUrl: {
      type: String,
      default: '/logo.png',
    },
    tagline: {
      type: String,
      default: 'Parcel & Bus Dispatch Network',
    },
    companyPhone: {
      type: String,
      default: '+91 98765 43210',
    },
    companyEmail: {
      type: String,
      default: 'dispatch@fasttrackcourier.com',
    },
    companyAddress: {
      type: String,
      default: 'Main Bus Terminal Road, Complex #4, Hyderabad, TS - 500001',
    },
    gstin: {
      type: String,
      default: '',
    },
    receiptFooterNote: {
      type: String,
      default: 'Thank you for choosing our bus parcel service. Please keep this receipt safe. Claims subject to local office terms.',
    },
    whatsappProvider: {
      type: String,
      enum: ['MOCK', 'TWILIO', 'META', 'WEBHOOK'],
      default: 'MOCK',
    },
    whatsappSenderNumber: {
      type: String,
      default: '+919876543210',
    },
    whatsappApiKey: {
      type: String,
      default: '',
    },
    whatsappApiUrl: {
      type: String,
      default: '',
    },
    standardRoutes: {
      type: [String],
      default: [
        'Hyderabad → Vijayawada',
        'Hyderabad → Guntur',
        'Hyderabad → Warangal',
        'Hyderabad → Visakhapatnam',
        'Hyderabad → Rajahmundry',
        'Hyderabad → Tirupati',
        'Hyderabad → Kurnool',
        'Hyderabad → Nellore',
        'Hyderabad → Bangalore',
        'Vijayawada → Hyderabad',
      ],
    },
    parcelTypes: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Setting', settingSchema);

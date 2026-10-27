require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');

try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}

const User = require('../models/User');
const Customer = require('../models/Customer');
const Booking = require('../models/Booking');
const BusDispatch = require('../models/BusDispatch');
const Notification = require('../models/Notification');
const Setting = require('../models/Setting');
const City = require('../models/City');
const Destination = require('../models/Destination');

const seedData = async (clearAllData = false) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('[Seed] Connected to MongoDB');
    }

    // 1. Ensure Single Default Admin User (from .env)
    const adminUsername = (process.env.ADMIN_USERNAME || 'admi').trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@fasttrackcourier.com').trim().toLowerCase();
    const adminName = process.env.ADMIN_NAME || 'Admin Manager';

    // Remove any extra non-admin users to enforce single-user rule
    await User.deleteMany({ username: { $ne: adminUsername } });

    let admin = await User.findOne({ username: adminUsername });
    if (!admin) {
      admin = await User.create({
        name: adminName,
        username: adminUsername,
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        phone: process.env.COMPANY_PHONE || '9876543210',
        branch: 'Hyderabad Main Terminal',
        active: true,
      });
      console.log(`[Seed] Single admin user created: ${adminUsername}`);
    } else {
      const isMatch = await admin.matchPassword(adminPassword);
      if (!isMatch || admin.role !== 'admin' || !admin.active) {
        admin.password = adminPassword;
        admin.role = 'admin';
        admin.active = true;
        await admin.save();
        console.log(`[Seed] Single admin user synced with .env credentials: ${adminUsername}`);
      }
    }

    // 2. Ensure System Settings
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({
        companyName: 'FastTrack Bus Parcel & Courier Services',
        companyPhone: '+91 98765 43210',
        companyEmail: 'dispatch@fasttrackcourier.com',
        companyAddress: 'MGBS Bus Terminal Road, Complex #4, Hyderabad, TS - 500001',
        whatsappProvider: 'MOCK',
        whatsappSenderNumber: '+919876543210',
        receiptFooterNote: 'Thank you for shipping with FastTrack. Present this receipt or 6-digit Order ID at destination counter.',
        standardRoutes: [],
        parcelTypes: [],
      });
      console.log('[Seed] Settings initialized');
    }

    // 3. Purge all dummy data if requested or clean initialization
    if (clearAllData || process.env.PURGE_DUMMY_DATA === 'true') {
      await Booking.deleteMany({});
      await Customer.deleteMany({});
      await BusDispatch.deleteMany({});
      await Notification.deleteMany({});
      await City.deleteMany({});
      await Destination.deleteMany({});
      console.log('[Seed] All dummy bookings, customers, bus dispatches, cities, destinations, and notifications purged successfully.');
    }
  } catch (error) {
    console.error('[Seed Error]:', error.message);
  }
};

if (require.main === module) {
  seedData(true).then(() => {
    console.log('[Seed] Clean Database Initialization Complete (All dummy/seeded cities removed).');
    process.exit(0);
  });
}

module.exports = seedData;

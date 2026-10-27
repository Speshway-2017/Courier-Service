const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const Destination = require('../models/Destination');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/settings/public
// @desc    Get public company profile information (no auth required)
// @access  Public
router.get('/public', async (req, res, next) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({
        companyName: process.env.COMPANY_NAME || 'FastTrack Bus Parcel & Courier Services',
        companyPhone: process.env.COMPANY_PHONE || '+91 98765 43210',
        companyEmail: process.env.COMPANY_EMAIL || 'dispatch@fasttrackcourier.com',
        companyAddress: process.env.COMPANY_ADDRESS || 'Main Bus Terminal Road, Complex #4, Hyderabad, TS - 500001',
        gstin: '',
        receiptFooterNote: 'Thank you for choosing our bus parcel service. Present this receipt or 6-digit Order ID at destination counter.',
        whatsappProvider: process.env.WHATSAPP_PROVIDER || 'MOCK',
        whatsappSenderNumber: process.env.WHATSAPP_SENDER_NUMBER || '+919876543210',
      });
    }

    res.json({
      success: true,
      data: {
        companyName: settings.companyName,
        logoUrl: settings.logoUrl || '/logo.png',
        tagline: settings.tagline || 'Parcel & Bus Dispatch Network',
        companyPhone: settings.companyPhone,
        companyEmail: settings.companyEmail,
        companyAddress: settings.companyAddress,
        gstin: settings.gstin || '',
        receiptFooterNote: settings.receiptFooterNote,
        standardRoutes: settings.standardRoutes || [],
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/settings
// @desc    Get system settings & WhatsApp configuration
// @access  Public / Private
router.get('/', async (req, res, next) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({
        companyName: process.env.COMPANY_NAME || 'FastTrack Bus Parcel & Courier Services',
        logoUrl: '/logo.png',
        tagline: 'Parcel & Bus Dispatch Network',
        companyPhone: process.env.COMPANY_PHONE || '+91 98765 43210',
        companyEmail: process.env.COMPANY_EMAIL || 'dispatch@fasttrackcourier.com',
        companyAddress: process.env.COMPANY_ADDRESS || 'Main Bus Terminal Road, Complex #4, Hyderabad, TS - 500001',
        gstin: '',
        receiptFooterNote: 'Thank you for choosing our bus parcel service. Present this receipt or 6-digit Order ID at destination counter.',
        whatsappProvider: process.env.WHATSAPP_PROVIDER || 'MOCK',
        whatsappSenderNumber: process.env.WHATSAPP_SENDER_NUMBER || '+919876543210',
      });
    }

    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/settings
// @desc    Update system settings
// @access  Private (Admin)
router.put('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting();
    }

    const {
      companyName,
      logoUrl,
      tagline,
      companyPhone,
      companyEmail,
      companyAddress,
      gstin,
      receiptFooterNote,
      whatsappProvider,
      whatsappSenderNumber,
      whatsappApiKey,
      whatsappApiUrl,
      standardRoutes,
      parcelTypes,
    } = req.body;

    if (companyName !== undefined) settings.companyName = companyName.trim();
    if (logoUrl !== undefined) settings.logoUrl = logoUrl;
    if (tagline !== undefined) settings.tagline = tagline.trim();
    if (companyPhone !== undefined) settings.companyPhone = companyPhone.trim();
    if (companyEmail !== undefined) settings.companyEmail = companyEmail.trim();
    if (companyAddress !== undefined) settings.companyAddress = companyAddress.trim();
    if (gstin !== undefined) settings.gstin = gstin.trim();
    if (receiptFooterNote !== undefined) settings.receiptFooterNote = receiptFooterNote.trim();
    if (whatsappProvider !== undefined) settings.whatsappProvider = whatsappProvider;
    if (whatsappSenderNumber !== undefined) settings.whatsappSenderNumber = whatsappSenderNumber.trim();
    if (whatsappApiKey !== undefined) settings.whatsappApiKey = whatsappApiKey.trim();
    if (whatsappApiUrl !== undefined) settings.whatsappApiUrl = whatsappApiUrl.trim();
    if (standardRoutes && Array.isArray(standardRoutes)) {
      settings.standardRoutes = standardRoutes;
      // Sync with Destination collection
      for (const r of standardRoutes) {
        if (r && r.trim()) {
          const exists = await Destination.findOne({ route: r.trim() });
          if (!exists) {
            await Destination.create({
              route: r.trim(),
              deliveryAddress: '',
              collectionPoints: [],
              active: true,
            });
          }
        }
      }
    }
    if (parcelTypes && Array.isArray(parcelTypes)) settings.parcelTypes = parcelTypes;

    await settings.save();

    res.json({
      success: true,
      message: 'System settings updated successfully',
      data: settings,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

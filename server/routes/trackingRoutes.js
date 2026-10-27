const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');

// @route   GET /api/tracking/:orderId
// @desc    Public parcel tracking by 6-digit Order ID
// @access  Public
router.get('/:orderId', async (req, res, next) => {
  try {
    const rawOrderId = req.params.orderId.trim();

    if (!/^\d{6}$/.test(rawOrderId)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 6-digit Order ID (e.g., 583214)',
      });
    }

    const booking = await Booking.findOne({ orderId: rawOrderId }).lean();

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `No parcel found with Order ID #${rawOrderId}. Please check the number or contact office.`,
      });
    }

    // Mask phone for privacy in public tracking
    const maskPhone = (phone) => {
      if (!phone || phone.length < 5) return '***';
      return `${phone.slice(0, 2)}****${phone.slice(-3)}`;
    };

    // Construct customer safe public response
    const trackingData = {
      orderId: booking.orderId,
      status: booking.status,
      parcelType: booking.parcelType,
      quantity: booking.quantity,
      weight: booking.weight,
      destination: booking.destination,
      customerName: booking.customerName,
      customerPhoneMasked: maskPhone(booking.customerPhone),
      createdAt: booking.createdAt,
      busDetails: booking.busDetails
        ? {
            busNumber: booking.busDetails.busNumber || null,
            route: booking.busDetails.route || null,
            operator: booking.busDetails.operator || null,
            departureTime: booking.busDetails.departureTime || null,
            dispatchedAt: booking.busDetails.dispatchedAt || null,
          }
        : null,
      timeline: booking.timeline || [],
      deliveredAt: booking.deliveredAt || null,
      branch: booking.branch || 'Main Counter',
    };

    res.json({
      success: true,
      data: trackingData,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Customer = require('../models/Customer');
const Destination = require('../models/Destination');
const City = require('../models/City');
const Setting = require('../models/Setting');
const { generateUniqueOrderId } = require('../services/orderIdService');
const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/bookings
// @desc    Create a new parcel booking with automatic 6-digit Order ID
// @access  Private (Staff/Admin)
router.post('/', protect, async (req, res, next) => {
  try {
    const {
      customerName,
      customerPhone,
      customerWhatsapp,
      receiverName,
      receiverPhone,
      fromCity = 'Hyderabad',
      toCity,
      deliveryAddress,
      destination,
      parcelType,
      quantity,
      weight,
      notes,
      amount,
      paymentStatus,
    } = req.body;

    const resolvedDestination = destination
      ? destination.trim()
      : (toCity ? `${(fromCity || 'Hyderabad').trim()} → ${toCity.trim()}` : '');

    if (!customerName || !customerPhone || !deliveryAddress || (!resolvedDestination && !toCity) || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Customer name, mobile number, delivery address, from/to destinations, and amount are required',
      });
    }

    // Generate unique 6-digit Order ID
    const orderId = await generateUniqueOrderId();

    // Find or create customer
    let customer = await Customer.findOne({ phone: customerPhone.trim() });
    if (!customer) {
      customer = await Customer.create({
        name: customerName.trim(),
        phone: customerPhone.trim(),
        whatsapp: customerWhatsapp ? customerWhatsapp.trim() : customerPhone.trim(),
        address: deliveryAddress.trim(),
        totalBookings: 1,
        totalSpent: Number(amount) || 0,
        lastBookingDate: new Date(),
      });
    } else {
      customer.totalBookings += 1;
      customer.totalSpent += Number(amount) || 0;
      customer.lastBookingDate = new Date();
      if (customerWhatsapp) customer.whatsapp = customerWhatsapp.trim();
      await customer.save();
    }

    const finalFromCity = (fromCity || 'Hyderabad').trim();
    const finalToCity = (toCity ? toCity.trim() : (resolvedDestination.includes('→') ? resolvedDestination.split('→')[1].trim() : resolvedDestination)).trim();

    // Automatically save From City, To City, and Delivery Location to MongoDB City collection
    try {
      if (finalFromCity) {
        let fromObj = await City.findOne({ name: new RegExp(`^${finalFromCity}$`, 'i') });
        if (!fromObj) {
          await City.create({
            name: finalFromCity,
            deliveryAddress: '',
            locations: [],
            active: true,
          });
        }
      }

      if (finalToCity) {
        const trimmedAddr = deliveryAddress ? deliveryAddress.trim() : '';
        let toObj = await City.findOne({ name: new RegExp(`^${finalToCity}$`, 'i') });
        if (!toObj) {
          await City.create({
            name: finalToCity,
            deliveryAddress: trimmedAddr,
            locations: trimmedAddr ? [trimmedAddr] : [],
            active: true,
          });
        } else if (trimmedAddr && !toObj.locations.includes(trimmedAddr)) {
          toObj.locations.push(trimmedAddr);
          if (!toObj.deliveryAddress) toObj.deliveryAddress = trimmedAddr;
          await toObj.save();
        }
      }
    } catch (persistErr) {
      console.error('Error auto-persisting city to MongoDB:', persistErr.message);
    }

    const booking = await Booking.create({
      orderId,
      customer: customer._id,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerWhatsapp: customerWhatsapp ? customerWhatsapp.trim() : customerPhone.trim(),
      receiverName: receiverName ? receiverName.trim() : '',
      receiverPhone: receiverPhone ? receiverPhone.trim() : '',
      fromCity: finalFromCity,
      toCity: finalToCity,
      deliveryAddress: deliveryAddress.trim(),
      destination: resolvedDestination,
      parcelType: parcelType || 'Box',
      quantity: Number(quantity) || 1,
      weight: Number(weight) || 0,
      notes: notes ? notes.trim() : '',
      amount: Number(amount) || 0,
      paymentStatus: paymentStatus || 'PAID',
      status: 'WAITING_FOR_BUS',
      timeline: [
        {
          status: 'BOOKED',
          timestamp: new Date(),
          description: `Parcel received at ${req.user.branch || 'office counter'} by ${req.user.name}`,
          updatedBy: req.user.name,
        },
        {
          status: 'WAITING_FOR_BUS',
          timestamp: new Date(),
          description: 'Ready for evening bus assignment',
          updatedBy: req.user.name,
        },
      ],
      createdBy: req.user._id,
      branch: req.user.branch || 'Main Office',
    });

    res.status(201).json({
      success: true,
      message: `Booking created successfully with Order ID ${orderId}`,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/bookings
// @desc    Get all bookings with filtering, search, and pagination
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const {
      search,
      status,
      destination,
      parcelType,
      startDate,
      endDate,
      page = 1,
      limit = 15,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    // Filter by status
    if (status && status !== 'ALL') {
      query.status = status;
    }

    // Filter by destination
    if (destination && destination !== 'ALL') {
      query.destination = new RegExp(destination, 'i');
    }

    // Filter by parcel type
    if (parcelType && parcelType !== 'ALL') {
      query.parcelType = parcelType;
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Search query (Order ID, Customer name, Phone, Bus number)
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { orderId: searchRegex },
        { customerName: searchRegex },
        { customerPhone: searchRegex },
        { 'busDetails.busNumber': searchRegex },
        { receiverName: searchRegex },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 15;
    const skip = (pageNum - 1) * limitNum;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('createdBy', 'name username')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Booking.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: bookings,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        limit: limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/bookings/:id
// @desc    Get single booking by ID or 6-digit Order ID
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const isOrderId = /^\d{6}$/.test(req.params.id);
    const query = isOrderId ? { orderId: req.params.id } : { _id: req.params.id };

    const booking = await Booking.findOne(query)
      .populate('customer')
      .populate('createdBy', 'name username branch')
      .populate('busDetails.dispatchedBy', 'name username');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/bookings/:id
// @desc    Update booking details
// @access  Private
router.put('/:id', protect, async (req, res, next) => {
  try {
    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const {
      customerName,
      customerPhone,
      customerWhatsapp,
      receiverName,
      receiverPhone,
      deliveryAddress,
      destination,
      parcelType,
      quantity,
      weight,
      notes,
      amount,
      paymentStatus,
    } = req.body;

    if (customerName) booking.customerName = customerName.trim();
    if (customerPhone) booking.customerPhone = customerPhone.trim();
    if (customerWhatsapp !== undefined) booking.customerWhatsapp = customerWhatsapp.trim();
    if (receiverName !== undefined) booking.receiverName = receiverName.trim();
    if (receiverPhone !== undefined) booking.receiverPhone = receiverPhone.trim();
    if (deliveryAddress) booking.deliveryAddress = deliveryAddress.trim();
    if (destination) booking.destination = destination.trim();
    if (parcelType) booking.parcelType = parcelType;
    if (quantity !== undefined) booking.quantity = Number(quantity);
    if (weight !== undefined) booking.weight = Number(weight);
    if (notes !== undefined) booking.notes = notes.trim();
    if (amount !== undefined) booking.amount = Number(amount);
    if (paymentStatus) booking.paymentStatus = paymentStatus;

    await booking.save();

    res.json({
      success: true,
      message: 'Booking details updated successfully',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
});

// @route   PATCH /api/bookings/:id/status
// @desc    Quick status update (DELIVERED, CANCELLED, etc.)
// @access  Private
router.patch('/:id/status', protect, async (req, res, next) => {
  try {
    const { status, cancellationReason, deliveryNotes } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (!['BOOKED', 'WAITING_FOR_BUS', 'DISPATCHED', 'DELIVERED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    booking.status = status;

    if (status === 'DELIVERED') {
      booking.deliveredAt = new Date();
      booking.timeline.push({
        status: 'DELIVERED',
        timestamp: new Date(),
        description: deliveryNotes || 'Parcel handed over to recipient / destination office',
        updatedBy: req.user.name,
      });
    } else if (status === 'CANCELLED') {
      booking.cancelledAt = new Date();
      booking.cancellationReason = cancellationReason || 'Cancelled by staff';
      booking.timeline.push({
        status: 'CANCELLED',
        timestamp: new Date(),
        description: `Cancelled: ${cancellationReason || 'Cancelled by staff'}`,
        updatedBy: req.user.name,
      });
    } else {
      booking.timeline.push({
        status,
        timestamp: new Date(),
        description: `Status updated to ${status}`,
        updatedBy: req.user.name,
      });
    }

    await booking.save();

    res.json({
      success: true,
      message: `Booking status updated to ${status}`,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/bookings/:id
// @desc    Cancel/Delete booking
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    await Booking.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: `Booking #${booking.orderId} deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

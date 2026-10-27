const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Booking = require('../models/Booking');
const { protect } = require('../middleware/auth');

// @route   GET /api/customers
// @desc    Get customer list with search & pagination
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const { search, page = 1, limit = 15, nameOnly, type } = req.query;
    const query = {};

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      if (nameOnly === 'true' || type === 'name') {
        query.$or = [
          { name: searchRegex },
          { phone: searchRegex },
        ];
      } else {
        query.$or = [
          { name: searchRegex },
          { phone: searchRegex },
          { whatsapp: searchRegex },
          { address: searchRegex },
        ];
      }
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 15;
    const skip = (pageNum - 1) * limitNum;

    const [customers, total] = await Promise.all([
      Customer.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Customer.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: customers,
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

// @route   GET /api/customers/:id
// @desc    Get single customer profile with full booking history
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Get all bookings for this customer
    const bookings = await Booking.find({
      $or: [{ customer: customer._id }, { customerPhone: customer.phone }],
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: {
        customer,
        bookings,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Driver = require('../models/Driver');
const { protect } = require('../middleware/auth');

// @route   GET /api/drivers
// @desc    Get all active drivers from MongoDB (optionally filter by search query)
// @access  Public / Private
router.get('/', async (req, res, next) => {
  try {
    const { search, all } = req.query;
    const filter = {};

    if (!all) {
      filter.active = true;
    }

    if (search && search.trim()) {
      const q = search.trim();
      const regex = new RegExp(q, 'i');
      filter.$or = [
        { name: regex },
        { phone: regex },
        { alternatePhone: regex },
        { licenseNumber: regex },
        { notes: regex },
      ];
    }

    const drivers = await Driver.find(filter).sort({ name: 1 });

    res.json({
      success: true,
      data: drivers,
      count: drivers.length,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/drivers/:id
// @desc    Get single driver by ID
// @access  Public / Private
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    let driver;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      driver = await Driver.findById(id);
    } else {
      driver = await Driver.findOne({ phone: id.trim() });
    }

    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    res.json({ success: true, data: driver });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/drivers
// @desc    Create or update driver profile in MongoDB
// @access  Private (Staff/Admin)
router.post('/', protect, async (req, res, next) => {
  try {
    const { name, phone, alternatePhone, licenseNumber, notes } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Driver name is required' });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Driver primary mobile number is required' });
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const cleanAlt = alternatePhone ? alternatePhone.replace(/\D/g, '').slice(-10) : '';

    let existingDriver = await Driver.findOne({ phone: cleanPhone });

    if (existingDriver) {
      existingDriver.name = name.trim();
      existingDriver.alternatePhone = cleanAlt;
      existingDriver.licenseNumber = licenseNumber ? licenseNumber.trim() : existingDriver.licenseNumber;
      existingDriver.notes = notes ? notes.trim() : existingDriver.notes;
      existingDriver.active = true;

      await existingDriver.save();

      return res.json({
        success: true,
        message: `Driver '${existingDriver.name}' (${cleanPhone}) updated successfully`,
        data: existingDriver,
      });
    }

    const newDriver = await Driver.create({
      name: name.trim(),
      phone: cleanPhone,
      alternatePhone: cleanAlt,
      licenseNumber: licenseNumber ? licenseNumber.trim() : '',
      notes: notes ? notes.trim() : '',
      active: true,
    });

    res.status(201).json({
      success: true,
      message: `Driver '${newDriver.name}' added successfully`,
      data: newDriver,
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/drivers/:id
// @desc    Update driver details in MongoDB
// @access  Private (Staff/Admin)
router.put('/:id', protect, async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    const { name, phone, alternatePhone, licenseNumber, notes, active } = req.body;

    if (name) driver.name = name.trim();

    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      const existing = await Driver.findOne({ phone: cleanPhone, _id: { $ne: driver._id } });
      if (existing) {
        return res.status(400).json({ success: false, message: `Another driver with phone number ${cleanPhone} already exists` });
      }
      driver.phone = cleanPhone;
    }

    if (alternatePhone !== undefined) {
      driver.alternatePhone = alternatePhone ? alternatePhone.replace(/\D/g, '').slice(-10) : '';
    }

    if (licenseNumber !== undefined) driver.licenseNumber = licenseNumber.trim();
    if (notes !== undefined) driver.notes = notes.trim();
    if (active !== undefined) driver.active = Boolean(active);

    await driver.save();

    res.json({
      success: true,
      message: `Driver '${driver.name}' updated successfully`,
      data: driver,
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/drivers/:id
// @desc    Delete driver from MongoDB
// @access  Private (Staff/Admin)
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    const driverName = driver.name;
    await Driver.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: `Driver '${driverName}' deleted from database`,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

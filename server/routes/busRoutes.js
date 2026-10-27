const express = require('express');
const router = express.Router();
const Bus = require('../models/Bus');
const { protect } = require('../middleware/auth');

// @route   GET /api/buses
// @desc    Get all active buses from MongoDB (optionally filter by search query or city)
// @access  Public / Private
router.get('/', async (req, res, next) => {
  try {
    const { search, fromCity, toCity, all } = req.query;
    const filter = {};

    if (!all) {
      filter.active = true;
    }

    if (search && search.trim()) {
      const q = search.trim();
      const regex = new RegExp(q, 'i');
      filter.$or = [
        { busNumber: regex },
        { busName: regex },
        { operator: regex },
        { route: regex },
        { fromCity: regex },
        { toCity: regex },
      ];
    }

    if (fromCity && fromCity.trim()) {
      filter.fromCity = new RegExp(`^${fromCity.trim()}$`, 'i');
    }

    if (toCity && toCity.trim()) {
      filter.toCity = new RegExp(`^${toCity.trim()}$`, 'i');
    }

    const buses = await Bus.find(filter).sort({ busNumber: 1 });

    res.json({
      success: true,
      data: buses,
      count: buses.length,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/buses/:id
// @desc    Get single bus by ID or busNumber
// @access  Public / Private
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    let bus;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      bus = await Bus.findById(id);
    } else {
      bus = await Bus.findOne({ busNumber: id.trim().toUpperCase() });
    }

    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' });
    }

    res.json({ success: true, data: bus });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/buses
// @desc    Create or update bus in MongoDB
// @access  Private (Staff/Admin)
router.post('/', protect, async (req, res, next) => {
  try {
    const {
      busNumber,
      busName,
      operator,
      fromCity,
      toCity,
      route,
      defaultDepartureTime,
      defaultArrivalTime,
      platformNumber,
      notes,
    } = req.body;

    if (!busNumber || !busNumber.trim()) {
      return res.status(400).json({ success: false, message: 'Bus registration number is required (e.g. AP 39 CN 3580)' });
    }

    const formattedBusNumber = busNumber.trim().toUpperCase();
    const routeComputed = route?.trim() || (fromCity?.trim() && toCity?.trim() ? `${fromCity.trim()} → ${toCity.trim()}` : '');

    let existingBus = await Bus.findOne({ busNumber: formattedBusNumber });

    if (existingBus) {
      existingBus.busName = busName !== undefined ? busName.trim() : existingBus.busName;
      existingBus.operator = operator !== undefined ? operator.trim() : existingBus.operator;
      existingBus.fromCity = fromCity !== undefined ? fromCity.trim() : existingBus.fromCity;
      existingBus.toCity = toCity !== undefined ? toCity.trim() : existingBus.toCity;
      existingBus.route = routeComputed || existingBus.route;
      existingBus.defaultDepartureTime = defaultDepartureTime !== undefined ? defaultDepartureTime.trim() : existingBus.defaultDepartureTime;
      existingBus.defaultArrivalTime = defaultArrivalTime !== undefined ? defaultArrivalTime.trim() : existingBus.defaultArrivalTime;
      existingBus.platformNumber = platformNumber !== undefined ? platformNumber.trim() : existingBus.platformNumber;
      existingBus.notes = notes !== undefined ? notes.trim() : existingBus.notes;
      existingBus.active = true;

      await existingBus.save();

      return res.json({
        success: true,
        message: `Bus ${formattedBusNumber} updated successfully`,
        data: existingBus,
      });
    }

    const newBus = await Bus.create({
      busNumber: formattedBusNumber,
      busName: busName ? busName.trim() : '',
      operator: operator ? operator.trim() : '',
      fromCity: fromCity ? fromCity.trim() : '',
      toCity: toCity ? toCity.trim() : '',
      route: routeComputed,
      defaultDepartureTime: defaultDepartureTime ? defaultDepartureTime.trim() : '',
      defaultArrivalTime: defaultArrivalTime ? defaultArrivalTime.trim() : '',
      platformNumber: platformNumber ? platformNumber.trim() : '',
      notes: notes ? notes.trim() : '',
      active: true,
    });

    res.status(201).json({
      success: true,
      message: `Bus ${formattedBusNumber} registered successfully`,
      data: newBus,
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/buses/:id
// @desc    Update bus details in MongoDB
// @access  Private (Staff/Admin)
router.put('/:id', protect, async (req, res, next) => {
  try {
    const bus = await Bus.findById(req.params.id);
    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' });
    }

    const {
      busNumber,
      busName,
      operator,
      fromCity,
      toCity,
      route,
      defaultDepartureTime,
      defaultArrivalTime,
      platformNumber,
      notes,
      active,
    } = req.body;

    if (busNumber) {
      const formatted = busNumber.trim().toUpperCase();
      const existing = await Bus.findOne({ busNumber: formatted, _id: { $ne: bus._id } });
      if (existing) {
        return res.status(400).json({ success: false, message: `Bus with number ${formatted} already exists` });
      }
      bus.busNumber = formatted;
    }

    if (busName !== undefined) bus.busName = busName.trim();
    if (operator !== undefined) bus.operator = operator.trim();
    if (fromCity !== undefined) bus.fromCity = fromCity.trim();
    if (toCity !== undefined) bus.toCity = toCity.trim();
    
    if (route !== undefined) {
      bus.route = route.trim();
    } else if (bus.fromCity && bus.toCity) {
      bus.route = `${bus.fromCity} → ${bus.toCity}`;
    }

    if (defaultDepartureTime !== undefined) bus.defaultDepartureTime = defaultDepartureTime.trim();
    if (defaultArrivalTime !== undefined) bus.defaultArrivalTime = defaultArrivalTime.trim();
    if (platformNumber !== undefined) bus.platformNumber = platformNumber.trim();
    if (notes !== undefined) bus.notes = notes.trim();
    if (active !== undefined) bus.active = Boolean(active);

    await bus.save();

    res.json({
      success: true,
      message: `Bus ${bus.busNumber} updated successfully`,
      data: bus,
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/buses/:id
// @desc    Delete bus from MongoDB
// @access  Private (Staff/Admin)
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const bus = await Bus.findById(req.params.id);
    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' });
    }

    const regNo = bus.busNumber;
    await Bus.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: `Bus ${regNo} deleted from database`,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

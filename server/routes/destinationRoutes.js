const express = require('express');
const router = express.Router();
const Destination = require('../models/Destination');
const Setting = require('../models/Setting');
const { protect, authorize } = require('../middleware/auth');


// Helper to sync routes to Setting model
const syncSettingRoutes = async () => {
  try {
    const destinations = await Destination.find({ active: true }).select('route');
    const routes = destinations.map((d) => d.route);
    let settings = await Setting.findOne();
    if (settings && routes.length > 0) {
      settings.standardRoutes = routes;
      await settings.save();
    }
  } catch (err) {
    console.error('Error syncing standardRoutes to Setting:', err.message);
  }
};

// @route   GET /api/destinations
// @desc    Get all destination routes and delivery details
// @access  Public / Private
router.get('/', async (req, res, next) => {
  try {
    const destinations = await Destination.find().sort({ createdAt: 1 });
    res.json({
      success: true,
      data: destinations,
      count: destinations.length,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/destinations/:id
// @desc    Get single destination by ID or Route Name
// @access  Private
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    let destination;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      destination = await Destination.findById(id);
    } else {
      destination = await Destination.findOne({ route: id });
    }

    if (!destination) {
      return res.status(404).json({ success: false, message: 'Destination not found' });
    }

    res.json({ success: true, data: destination });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/destinations
// @desc    Add new destination route with delivery details (saves in DB)
// @access  Private (Staff/Admin)
router.post('/', protect, async (req, res, next) => {
  try {
    const {
      route,
      fromCity,
      toCity,
      deliveryAddress,
      collectionPoints,
      receiverName,
      receiverPhone,
      standardCharge,
      dispatchSchedule,
      notes,
    } = req.body;

    if (!route || !route.trim()) {
      return res.status(400).json({ success: false, message: 'Destination route name is required' });
    }

    const trimmedRoute = route.trim();

    // Check if route already exists
    let existing = await Destination.findOne({ route: trimmedRoute });
    if (existing) {
      // Update existing destination with new delivery details
      if (deliveryAddress !== undefined) existing.deliveryAddress = deliveryAddress.trim();
      if (fromCity !== undefined) existing.fromCity = fromCity.trim();
      if (toCity !== undefined) existing.toCity = toCity.trim();
      if (collectionPoints !== undefined) {
        existing.collectionPoints = Array.isArray(collectionPoints)
          ? collectionPoints.map((c) => c.trim()).filter(Boolean)
          : [collectionPoints.trim()];
      }
      if (receiverName !== undefined) existing.receiverName = receiverName.trim();
      if (receiverPhone !== undefined) existing.receiverPhone = receiverPhone.trim();
      if (standardCharge !== undefined) existing.standardCharge = Number(standardCharge) || 0;
      if (dispatchSchedule !== undefined) existing.dispatchSchedule = dispatchSchedule.trim();
      if (notes !== undefined) existing.notes = notes.trim();
      existing.active = true;

      await existing.save();
      await syncSettingRoutes();

      return res.json({
        success: true,
        message: `Destination '${trimmedRoute}' updated successfully in database`,
        data: existing,
      });
    }

    // Process collection points list
    let collPoints = [];
    if (Array.isArray(collectionPoints)) {
      collPoints = collectionPoints.map((c) => c.trim()).filter(Boolean);
    } else if (typeof collectionPoints === 'string' && collectionPoints.trim()) {
      collPoints = collectionPoints.split(',').map((c) => c.trim()).filter(Boolean);
    }

    // If deliveryAddress provided and not in collPoints, include it
    if (deliveryAddress && deliveryAddress.trim() && !collPoints.includes(deliveryAddress.trim())) {
      collPoints.unshift(deliveryAddress.trim());
    }

    // Auto deduce toCity if not passed
    let parsedToCity = toCity;
    if (!parsedToCity && trimmedRoute.includes('→')) {
      parsedToCity = trimmedRoute.split('→')[1].trim();
    } else if (!parsedToCity && trimmedRoute.includes('->')) {
      parsedToCity = trimmedRoute.split('->')[1].trim();
    }

    const newDestination = await Destination.create({
      route: trimmedRoute,
      fromCity: fromCity ? fromCity.trim() : 'Hyderabad',
      toCity: parsedToCity || trimmedRoute,
      deliveryAddress: deliveryAddress ? deliveryAddress.trim() : '',
      collectionPoints: collPoints,
      receiverName: receiverName ? receiverName.trim() : '',
      receiverPhone: receiverPhone ? receiverPhone.trim() : '',
      standardCharge: Number(standardCharge) || 0,
      dispatchSchedule: dispatchSchedule ? dispatchSchedule.trim() : '',
      notes: notes ? notes.trim() : '',
      active: true,
    });

    await syncSettingRoutes();

    res.status(201).json({
      success: true,
      message: `New Destination '${trimmedRoute}' saved to database successfully`,
      data: newDestination,
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/destinations/:id
// @desc    Update destination & delivery details in database
// @access  Private (Admin)
router.put('/:id', protect, async (req, res, next) => {
  try {
    const destination = await Destination.findById(req.params.id);
    if (!destination) {
      return res.status(404).json({ success: false, message: 'Destination not found' });
    }

    const {
      route,
      fromCity,
      toCity,
      deliveryAddress,
      collectionPoints,
      receiverName,
      receiverPhone,
      standardCharge,
      dispatchSchedule,
      active,
      notes,
    } = req.body;

    if (route) destination.route = route.trim();
    if (fromCity !== undefined) destination.fromCity = fromCity.trim();
    if (toCity !== undefined) destination.toCity = toCity.trim();
    if (deliveryAddress !== undefined) destination.deliveryAddress = deliveryAddress.trim();
    if (collectionPoints !== undefined) {
      destination.collectionPoints = Array.isArray(collectionPoints)
        ? collectionPoints.map((c) => c.trim()).filter(Boolean)
        : collectionPoints.split(',').map((c) => c.trim()).filter(Boolean);
    }
    if (receiverName !== undefined) destination.receiverName = receiverName.trim();
    if (receiverPhone !== undefined) destination.receiverPhone = receiverPhone.trim();
    if (standardCharge !== undefined) destination.standardCharge = Number(standardCharge) || 0;
    if (dispatchSchedule !== undefined) destination.dispatchSchedule = dispatchSchedule.trim();
    if (active !== undefined) destination.active = Boolean(active);
    if (notes !== undefined) destination.notes = notes.trim();

    await destination.save();
    await syncSettingRoutes();

    res.json({
      success: true,
      message: `Destination '${destination.route}' updated successfully in database`,
      data: destination,
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/destinations/:id
// @desc    Delete destination from database
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const destination = await Destination.findById(req.params.id);
    if (!destination) {
      return res.status(404).json({ success: false, message: 'Destination not found' });
    }

    const routeName = destination.route;
    await Destination.findByIdAndDelete(req.params.id);
    await syncSettingRoutes();

    res.json({
      success: true,
      message: `Destination '${routeName}' deleted successfully from database`,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

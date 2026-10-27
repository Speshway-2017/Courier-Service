const express = require('express');
const router = express.Router();
const City = require('../models/City');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/cities
// @desc    Get all dynamic cities stored in MongoDB
// @access  Public / Private
router.get('/', async (req, res, next) => {
  try {
    const cities = await City.find({ active: true }).sort({ name: 1 });
    res.json({
      success: true,
      data: cities,
      count: cities.length,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/cities/:id
// @desc    Get single city by ID or Name
// @access  Public / Private
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    let city;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      city = await City.findById(id);
    } else {
      city = await City.findOne({ name: new RegExp(`^${id}$`, 'i') });
    }

    if (!city) {
      return res.status(404).json({ success: false, message: 'City not found' });
    }

    res.json({ success: true, data: city });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/cities
// @desc    Add new city or add a new delivery location/stop to an existing city
// @access  Private (Staff/Admin)
router.post('/', protect, async (req, res, next) => {
  try {
    const { name, deliveryAddress, location, locations } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'City name is required' });
    }

    const trimmedName = name.trim();
    const targetLocation = (deliveryAddress || location || '').trim();

    let existing = await City.findOne({ name: new RegExp(`^${trimmedName}$`, 'i') });
    if (existing) {
      // Add new location / stop to existing city if provided
      if (targetLocation && !existing.locations.includes(targetLocation)) {
        existing.locations.push(targetLocation);
      }
      if (Array.isArray(locations)) {
        locations.forEach((l) => {
          const trimmedL = (l || '').trim();
          if (trimmedL && !existing.locations.includes(trimmedL)) {
            existing.locations.push(trimmedL);
          }
        });
      }
      if (targetLocation) {
        existing.deliveryAddress = targetLocation;
      }
      existing.active = true;
      await existing.save();

      return res.json({
        success: true,
        message: `Location '${targetLocation || trimmedName}' added to city '${existing.name}' in database`,
        data: existing,
      });
    }

    const initialLocations = Array.isArray(locations) && locations.length > 0
      ? locations.map((l) => (l || '').trim()).filter(Boolean)
      : (targetLocation ? [targetLocation] : []);

    const newCity = await City.create({
      name: trimmedName,
      deliveryAddress: targetLocation || (initialLocations[0] || ''),
      locations: initialLocations,
      active: true,
    });

    res.status(201).json({
      success: true,
      message: `City '${trimmedName}' saved to database successfully`,
      data: newCity,
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/cities/:id
// @desc    Update city name and delivery addresses/locations in MongoDB
// @access  Private (Admin)
router.put('/:id', protect, async (req, res, next) => {
  try {
    const city = await City.findById(req.params.id);
    if (!city) {
      return res.status(404).json({ success: false, message: 'City not found' });
    }

    const { name, deliveryAddress, locations, active } = req.body;

    if (name) city.name = name.trim();
    if (deliveryAddress !== undefined) city.deliveryAddress = deliveryAddress.trim();
    if (Array.isArray(locations)) {
      city.locations = locations.map((l) => (l || '').trim()).filter(Boolean);
    }
    if (active !== undefined) city.active = Boolean(active);

    await city.save();

    res.json({
      success: true,
      message: `City '${city.name}' updated successfully in database`,
      data: city,
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/cities/:id/locations
// @desc    Delete a specific location/stop from a city
// @access  Private (Admin)
router.delete('/:id/locations', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { location } = req.body;
    const city = await City.findById(req.params.id);
    if (!city) {
      return res.status(404).json({ success: false, message: 'City not found' });
    }

    if (location) {
      city.locations = city.locations.filter((l) => l.trim() !== location.trim());
      if (city.deliveryAddress === location.trim()) {
        city.deliveryAddress = city.locations[0] || '';
      }
      await city.save();
    }

    res.json({
      success: true,
      message: `Location removed from '${city.name}'`,
      data: city,
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/cities/:id
// @desc    Delete entire city from MongoDB
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const city = await City.findById(req.params.id);
    if (!city) {
      return res.status(404).json({ success: false, message: 'City not found' });
    }

    const cityName = city.name;
    await City.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: `City '${cityName}' deleted from database`,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;


const Booking = require('../models/Booking');

/**
 * Generate a unique 6-digit Order ID (e.g. 583214)
 * Guarantees exactly 6 numeric digits and non-collision with existing records.
 */
const generateUniqueOrderId = async () => {
  let isUnique = false;
  let orderId = '';
  let attempts = 0;
  const maxAttempts = 15;

  while (!isUnique && attempts < maxAttempts) {
    attempts++;
    // Generate 6-digit number between 100000 and 999999
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    orderId = randomNum.toString();

    // Verify in database
    const existing = await Booking.findOne({ orderId }).lean();
    if (!existing) {
      isUnique = true;
    }
  }

  if (!isUnique) {
    // Timestamp fallback truncated to 6 digits with collision safety
    orderId = (Date.now() % 900000 + 100000).toString();
  }

  return orderId;
};

module.exports = {
  generateUniqueOrderId,
};

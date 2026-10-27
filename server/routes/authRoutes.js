const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// Generate JWT with standard payload
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      username: user.username,
    },
    process.env.JWT_SECRET || 'courier_dispatch_secret_jwt_key_2025_secure',
    {
      expiresIn: '7d', // 7 day valid operational session
    }
  );
};

// @route   POST /api/auth/login
// @desc    Authenticate user & get session token
// @access  Public (Strict Rate Limited)
router.post('/login', async (req, res, next) => {
  try {
    const { identifier, username, email, password } = req.body || {};
    const rawKey = typeof identifier === 'string' ? identifier : typeof username === 'string' ? username : typeof email === 'string' ? email : '';
    const loginKey = rawKey.trim().toLowerCase();
    const safePassword = typeof password === 'string' ? password : '';

    if (!loginKey || !safePassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both username/email and password as valid text',
      });
    }

    // Support both 'admi' and 'admin' aliases for .env configured admin
    const envAdminUser = (process.env.ADMIN_USERNAME || 'admi').trim().toLowerCase();
    const isEnvAdminAttempt =
      loginKey === envAdminUser ||
      (envAdminUser === 'admi' && loginKey === 'admin') ||
      (envAdminUser === 'admin' && loginKey === 'admi');

    // Find user in database
    let user = await User.findOne({
      $or: [
        { username: loginKey },
        { email: loginKey },
        { phone: loginKey },
      ],
    });

    // If attempting login with admin alias and not found under exact key, check primary admin
    if (!user && isEnvAdminAttempt) {
      user = await User.findOne({ role: 'admin' });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.',
      });
    }

    if (!user.active) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact your manager.',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      // Check fallback against .env password for admin account
      if (user.role === 'admin' && password === (process.env.ADMIN_PASSWORD || 'admin123')) {
        // Sync password to hash
        user.password = password;
        await user.save();
      } else {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials. Incorrect password.',
        });
      }
    }

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        branch: user.branch,
        phone: user.phone,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/auth/me
// @desc    Validate session & get current user profile
// @access  Private
router.get('/me', protect, async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
      branch: req.user.branch,
      phone: req.user.phone,
    },
  });
});

// @route   GET /api/auth/users
// @desc    Get all staff/admin users
// @access  Private (Admin only)
router.get('/users', protect, authorize('admin'), async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/users
// @desc    Create a new user/staff account (Disabled - Single Admin mode)
// @access  Private (Admin only)
router.post('/users', protect, authorize('admin'), async (req, res) => {
  return res.status(403).json({
    success: false,
    message: 'User creation is disabled. The system operates in single-admin mode configured via .env.',
  });
});

// @route   PUT /api/auth/users/:id
// @desc    Update user status / role / details
// @access  Private (Admin only)
router.put('/users/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { name, role, phone, branch, active, password } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (role) user.role = role;
    if (phone !== undefined) user.phone = phone;
    if (branch !== undefined) user.branch = branch;
    if (active !== undefined) user.active = active;
    if (password) user.password = password;

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        branch: user.branch,
        active: user.active,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// @desc Register a new user
// @route POST /api/auth/register
// @access Public
exports.register = async (req, res, next) => {
  try {
    const { fullName, email, password, language } = req.body;

    // Validation
    if (!fullName || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide fullName, email, and password'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        message: 'Email already registered'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      fullName,
      email: email.toLowerCase(),
      password: hashedPassword,
      language: language || 'en'
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        language: user.language
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc Login user
// @route POST /api/auth/login
// @access Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password'
      });
    }

    // Find user and select password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        language: user.language,
        travel_mode: user.travel_mode
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update push token
// @route PUT /api/auth/update-push-token
// @access Private
exports.updatePushToken = async (req, res, next) => {
  try {
    const { pushToken } = req.body;

    if (!pushToken) {
      return res.status(400).json({
        status: 'error',
        message: 'Push token is required'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { pushToken },
      { new: true }
    );

    res.status(200).json({
      status: 'success',
      message: 'Push token updated',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get current user
// @route GET /api/auth/me
// @access Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      status: 'success',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        language: user.language,
        travel_mode: user.travel_mode,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

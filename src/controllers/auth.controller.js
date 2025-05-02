const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { validationResult } = require('express-validator');
require('dotenv').config();

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d' // Token expires in 7 days
  });
};

// Register new user
exports.register = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password
    });

    // Generate JWT token
    const token = generateToken(user.id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await user.isValidPassword(password);
    
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = generateToken(user.id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Google OAuth callback
exports.googleCallback = async (req, res) => {
  try {
    // Google profile data will be available in req.user from Passport
    const { id, displayName, emails, photos } = req.user;
    
    let [firstName, lastName] = displayName.split(' ');
    if (!lastName) lastName = ''; // Handle single name users
    
    // Check if user already exists with this Google ID
    let user = await User.findOne({ where: { googleId: id } });
    
    if (!user) {
      // If not found by googleId, try to find by email
      if (emails && emails.length > 0) {
        user = await User.findOne({ where: { email: emails[0].value } });
      }
      
      if (user) {
        // If found by email, update with Google ID
        user.googleId = id;
        if (photos && photos.length > 0) {
          user.profilePicture = photos[0].value;
        }
        await user.save();
      } else {
        // Create new user
        user = await User.create({
          firstName,
          lastName,
          email: emails && emails.length > 0 ? emails[0].value : null,
          googleId: id,
          profilePicture: photos && photos.length > 0 ? photos[0].value : null,
          isEmailVerified: true // Google already verified the email
        });
      }
    }

    // Generate JWT token
    const token = generateToken(user.id);

    // Prepare user data to be sent to frontend
    const userData = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email
    };

    // Create a JSON string to be used as query params
    const userDataStr = encodeURIComponent(JSON.stringify({
      token,
      user: userData
    }));

    // Redirect to frontend with token and user data
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/?auth=${userDataStr}`);
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=Authentication failed`);
  }
};

// Get current user info
exports.getCurrentUser = async (req, res) => {
  try {
    // User is attached to request by auth middleware
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ user });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error while fetching user data' });
  }
};
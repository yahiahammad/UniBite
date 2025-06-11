const User = require('../Models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationEmail } = require('../utils/emailService');


// Login user controller
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Add .select('+password') to include the password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isVerified) {
      return res.status(401).json({ message: 'Please verify your email before logging in' });
    }

    // Now user.password should be available
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    // Generate JWT
    const token = jwt.sign(
        { id: user._id, email: user.email, userType: user.userType },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

    // Set JWT as HTTP-only cookie
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // Remove password before sending response
    user.password = undefined;

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.userType,
        newsletterSubscribed: user.newsletterSubscribed,
        lastNewsletterToggle: user.lastNewsletterToggle
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User with this email already exists.' 
      });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    const newUser = new User({
      name,
      email,
      password,
      verificationToken,
      verificationTokenExpires
    });

    await newUser.save();

    // Send verification email
    const emailSent = await sendVerificationEmail(email, verificationToken);
    if (!emailSent) {
      // If email sending fails, delete the user and return error
      await User.findByIdAndDelete(newUser._id);
      return res.status(500).json({ 
        success: false,
        message: 'Error sending verification email. Please try again.' 
      });
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully! Please check your email to verify your account.'
    });

  } catch (error) {
    console.error('Registration Error:', error);
    // Check if it's a duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: 'User with this email already exists.' 
      });
    }
    res.status(500).json({ 
      success: false,
      message: 'An error occurred during registration. Please try again.' 
    });
  }
};

// Verify email endpoint
exports.verifyEmail = async (req, res) => {
  const { token } = req.query;

  try {
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Error verifying email' });
  }
};

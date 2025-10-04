const User = require('../Models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationEmail, sendResetPasswordEmail } = require('../utils/emailService');

// Email validation configuration
const ALLOWED_EMAIL_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN || '@miuegypt.edu.eg';



exports.loginUser = async (req, res) => {
  const { email, password, remember } = req.body;

  try {
    
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isVerified) {
      return res.status(401).json({ message: 'Please verify your email before logging in' });
    }

    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    
    const tokenExpiration = remember ? '30d' : '24h';
    
    const token = jwt.sign(
        { id: user._id, email: user.email, userType: user.userType },
        process.env.JWT_SECRET,
        { expiresIn: tokenExpiration }
    );

    
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: remember ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000 //milliseconds
    };

    res.cookie('jwt', token, cookieOptions);

    
    user.password = undefined;

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.userType,
        newsletterSubscribed: user.newsletterSubscribed,
        lastNewsletterToggle: user.lastNewsletterToggle,
        phoneNumber: user.phoneNumber
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Validate MIU email domain
    if (!email.endsWith(ALLOWED_EMAIL_DOMAIN)) {
      return res.status(400).json({
        success: false,
        message: `Please use your MIU email address (${ALLOWED_EMAIL_DOMAIN})`
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User with this email already exists.' 
      });
    }

    
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; 

    const newUser = new User({
      name,
      email,
      password,
      verificationToken,
      verificationTokenExpires
    });

    await newUser.save();

    
    const emailSent = await sendVerificationEmail(email, verificationToken);
    if (!emailSent) {
      
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


exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'No user found with that email address' });
    }

    
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    
    const emailSent = await sendResetPasswordEmail(user.email, resetToken);
    
    if (!emailSent) {
      return res.status(500).json({ message: 'Error sending password reset email' });
    }

    res.status(200).json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Error processing password reset request' });
  }
};


exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.body;
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired password reset token' });
    }

    res.status(200).json({ message: 'Token is valid' });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ message: 'Error verifying reset token' });
  }
};


exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters long and contain uppercase, lowercase, number and special character'
      });
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired password reset token' });
    }

    
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
};

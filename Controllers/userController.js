const User = require('../Models/User');
const jwt = require('jsonwebtoken');


// Login user controller
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Add .select('+password') to include the password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Now user.password should be available
    if (user.password !== password) {
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
  const {
    name,
    email,
    password
} = req.body;

  try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
          return res.status(400).json({ message: 'User with this email already exists.' });
      }
      const newUser = new User({
          name,
          email,
          password
      });

      await newUser.save();

      res.status(201).json({
          message: 'User registered successfully!'
      });

  } catch (error) {
      console.error('Registration Error:', error);
      res.status(500).json({ message: 'An error occurred during registration.' });
  }
};

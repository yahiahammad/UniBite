const User = require('../Models/User'); // Adjust to your actual path

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

    // Remove password before sending response
    user.password = undefined;
    res.status(200).json({ message: 'Login successful', user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
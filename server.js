// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env

const app = express();

app.set('view engine', 'ejs');
app.set('views', '/Views');
app.set('auth', 'Views/auth');


// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse incoming JSON requests

// Connect to MongoDB (removed deprecated options)
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.log('❌ DB Error:', err));

// --- Import all your modular route files (using capital 'Routes') ---
// Make sure these files exist in your 'Routes/' directory
const userRoutes = require('./Routes/userRoutes');
const vendorRoutes = require('./Routes/vendorRoutes');
const menuItemRoutes = require('./Routes/menuItemRoutes');
const orderRoutes = require('./Routes/orderRoutes');
const reviewRoutes = require('./Routes/reviewRoutes');

// --- MOUNT YOUR ROUTES (This was missing!) ---
app.use('/api/users', userRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/menuitems', menuItemRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);

app.get('/api/test', (req, res) => {
    res.status(200).json({ message: 'Server is up and running! 🎉 /api/test works!' });
});

app.get('/login' ,(req,res)=> {

    res.render('auth/login')

});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
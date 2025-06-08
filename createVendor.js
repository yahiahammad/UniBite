// seed_scripts/createVendor.js
require('dotenv').config();
const mongoose = require('mongoose');
const Vendor = require('./Models/Vendor');

const mongoURI = process.env.MONGO_URI;

async function createAndSeedVendor() {
  try {
    if (!mongoURI) {
      console.error('❌ MONGO_URI is not defined in your .env file.');
      process.exit(1);
    }

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected for vendor seeding.');

    const vendor = await Vendor.create({
      name: "MyCorner",
      email:"mycorner@unibitecanteam.com",
      description: "Sure sure sure",
      location: { building: "Next to K", lat: 30.0717, lng: 31.0264 },
      openingHours: "Mon-Fri: 7 AM - 7 PM",
      contactInfo: "mycorner@unibitecanteam.com",
      logoURL: "https://placehold.co/80x80/007bff/ffffff?text=UCE",
      tags: ["cafe", "lunch", "dinner", "snacks"],
      isActive: true,
    });

    console.log("--------------------------------------------------");
    console.log("🎉 Vendor 'UniBite Campus Eatery' created successfully!");
    console.log("👉 **IMPORTANT: Copy this Vendor ID for other seed scripts:**");
    console.log(`Vendor ID: ${vendor._id}`);
    console.log("--------------------------------------------------");

  } catch (err) {
    console.error('❌ DB Vendor Seeding Error:', err);
  } finally {
    if (mongoose.connection.readyState === 1) {
        await mongoose.disconnect();
        console.log('👋 MongoDB connection closed.');
    }
  }
}

createAndSeedVendor();
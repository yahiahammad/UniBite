// seed_scripts/seedUser.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./Models/User');

const mongoURI = process.env.MONGO_URI;

async function seedUsers() {
  try {
    if (!mongoURI) {
      console.error('❌ MONGO_URI is not defined in your .env file.');
      process.exit(1);
    }

    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected for user seeding.');

    // IMPORTANT: Replace this with the ACTUAL Vendor ID you got from createVendor.js
    const YOUR_VENDOR_ID = "6841ace9a8b0bdf93d30e746";
    if (YOUR_VENDOR_ID === "6841ace9a8b0bdf93d30e746" || !mongoose.Types.ObjectId.isValid(YOUR_VENDOR_ID)) {
      console.warn('⚠️ WARNING: Vendor ID not updated in seedUser.js. Admin user will not be linked to a vendor.');
      // You might want to exit here if the admin link is critical for initial setup
      // process.exit(1);
    }

    const usersToSeed = [
      {
        name: "Student A",
        email: "student.a@uni.edu",
        password: "password123", // Reminder: Plain text for now, insecure for production!
        phoneNumber: "01011112222",
        userType: "student",
        universityId: "U001",
      },
      {
        name: "Staff B",
        email: "staff.b@uni.edu",
        password: "securepassword",
        phoneNumber: "01033334444",
        userType: "staff",
        universityId: "U002",
      },
      {
        name: "Admin C",
        email: "admin.c@unibite.com",
        password: "adminpassword",
        phoneNumber: "01055556666",
        userType: "admin",
        vendorId: mongoose.Types.ObjectId.isValid(YOUR_VENDOR_ID) ? YOUR_VENDOR_ID : undefined, // Link if valid
        universityId: "U003",
      },
    ];

    const insertedUsers = await User.insertMany(usersToSeed);
    console.log('🌱 Users seeded successfully!');
    insertedUsers.forEach(user => {
      console.log(`- User: ${user.name}, ID: ${user._id}, Type: ${user.userType}`);
      if (user.userType === 'admin' && user.vendorId) {
        console.log(`  (Admin for Vendor ID: ${user.vendorId})`);
      }
    });

  } catch (err) {
    console.error('❌ DB User Seeding Error:', err);
  } finally {
    if (mongoose.connection.readyState === 1) {
        await mongoose.disconnect();
        console.log('👋 MongoDB connection closed.');
    }
  }
}

seedUsers();
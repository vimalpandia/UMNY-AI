const mongoose = require('mongoose');
const env = require('./env');
const bcrypt = require('bcryptjs');

let isConnected = false;

async function connectDB() {
  if (isConnected) return mongoose.connection;

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    console.log(`[MongoDB] Connected successfully to: ${conn.connection.host}/${conn.connection.name}`);

    // Seed default admin account if not already created
    await seedInitialAdmin();

    return conn;
  } catch (error) {
    console.warn(`[MongoDB Warning] Direct database connection failed: ${error.message}`);
    console.warn(`[MongoDB Info] Server will operate with available memory services until a live MongoDB Atlas URI is supplied.`);
    return null;
  }
}

async function seedInitialAdmin() {
  try {
    const User = require('../models/User');
    const adminExists = await User.findOne({ email: env.INITIAL_ADMIN_EMAIL.toLowerCase() });
    
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(env.INITIAL_ADMIN_PASSWORD, salt);
      
      await User.create({
        name: 'UMNY Administrator',
        email: env.INITIAL_ADMIN_EMAIL.toLowerCase(),
        passwordHash,
        role: 'admin',
        preferences: {
          theme: 'dark',
          defaultModel: 'gemini-2.5-flash',
          memoryEnabled: true,
          temperature: 0.7,
        },
      });
      console.log(`[MongoDB] Initial admin account initialized: ${env.INITIAL_ADMIN_EMAIL}`);
    }
  } catch (err) {
    console.error('[MongoDB] Error during initial admin seed:', err.message);
  }
}

module.exports = {
  connectDB,
  isConnected: () => isConnected || mongoose.connection.readyState === 1,
};

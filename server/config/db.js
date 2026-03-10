const mongoose = require('mongoose');
const { ServerApiVersion } = require('mongodb');
const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"])

const connectDB = async () => {
  try {
    console.log(process.env.MONGO_URI ? '🔗 Connecting to MongoDB...' : '⚠ MONGO_URI not set in .env');
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      // Use Server API v1 for Stable API compatibility when supported by the
      // underlying Node MongoDB driver. This is optional but recommended
      // for newer Atlas clusters and drivers.
      serverApi: ServerApiVersion.v1,
    });

    console.log(`✓ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`✗ MongoDB Connection Failed: ${error.message}`);
    console.warn('⚠ Server running without DB — check Atlas network access & credentials');
    // Continue running in dev mode even if DB fails
  }
};

module.exports = connectDB;

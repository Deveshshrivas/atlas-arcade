const mongoose = require('mongoose');
const dns = require('dns');

// Configure DNS resolvers (Google & Cloudflare) to prevent SRV lookup failure (querySrv ECONNREFUSED) common on Windows and certain ISPs
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (dnsErr) {
  console.warn('Could not set custom DNS servers:', dnsErr.message);
}

let isConnected = false;
let connectionError = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('<username>') || uri.includes('<password>')) {
    connectionError = 'MongoDB Atlas URI is not configured yet. Please update MONGODB_URI in .env with your credentials.';
    console.warn('\x1b[33m%s\x1b[0m', '⚠️  ' + connectionError);
    return false;
  }

  try {
    console.log('Connecting to MongoDB Atlas...');
    const conn = await mongoose.connect(uri, {
      dbName: 'auth_demo',
    });
    isConnected = true;
    connectionError = null;
    console.log('\x1b[32m%s\x1b[0m', `✅ MongoDB Atlas connected successfully: ${conn.connection.host}`);
    return true;
  } catch (error) {
    isConnected = false;
    connectionError = error.message;
    console.error('\x1b[31m%s\x1b[0m', `❌ MongoDB Atlas connection error: ${error.message}`);
    console.log('\x1b[36m%s\x1b[0m', '💡 Troubleshooting tips:');
    console.log('   1. Verify your database username and password in .env (ensure password characters are URL-encoded if special).');
    console.log('   2. Verify Network Access in MongoDB Atlas (allow access from 0.0.0.0/0 or your current IP).');
    console.log('   3. Ensure your cluster is active and not paused.');
    return false;
  }
};

const getStatus = () => {
  return {
    connected: isConnected,
    readyState: mongoose.connection.readyState, // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    error: connectionError,
  };
};

module.exports = { connectDB, getStatus };

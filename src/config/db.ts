import dns from 'dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Ensure SRV DNS records resolve reliably on Windows networks
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore if custom DNS is restricted
}

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      console.warn('⚠️ Warning: MONGODB_URI is not defined in environment variables.');
      return;
    }

    // Check if placeholder is still present
    if (mongoURI.includes('<username>') || mongoURI.includes('<password>')) {
      console.warn('⚠️ Warning: MONGODB_URI contains default placeholder credentials (<username>:<password>). Please update server/.env with your real MongoDB Atlas connection string.');
      return;
    }

    const conn = await mongoose.connect(mongoURI);
    console.log(`✅ Successfully connected to MongoDB Atlas! Host: ${conn.connection.host} (DB: ${conn.connection.name || 'default'})`);
  } catch (error) {
    console.error('❌ Error connecting to MongoDB Atlas:', error);
    // Note: Do not hard exit in development if user is setting up environment keys
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

export default connectDB;

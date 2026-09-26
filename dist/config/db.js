"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const connectDB = async () => {
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
        const conn = await mongoose_1.default.connect(mongoURI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    }
    catch (error) {
        console.error('❌ Error connecting to MongoDB Atlas:', error);
        // Note: Do not hard exit in development if user is setting up environment keys
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    }
};
exports.connectDB = connectDB;
exports.default = exports.connectDB;

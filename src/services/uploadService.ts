import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// dotenv.config();

// // Configure Cloudinary
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
//   api_key: process.env.CLOUDINARY_API_KEY || '',
//   api_secret: process.env.CLOUDINARY_API_SECRET || '',
// });

dotenv.config();

// Trim any hidden whitespace from env variables
const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || 'kt0lwlhz').trim();
const apiKey = (process.env.CLOUDINARY_API_KEY || '').trim();
const apiSecret = (process.env.CLOUDINARY_API_SECRET || '').trim();

// Configure Cloudinary
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

// Ensure local upload folder exists for fallback
const UPLOAD_DIR = path.resolve(__dirname, '../../public/uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Upload buffer to Cloudinary with automatic local disk fallback
 */
export async function uploadImageBuffer(
  buffer: Buffer,
  folder = 'ai_political_posters',
  filenamePrefix = 'poster'
): Promise<string> {
  // const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  // const apiKey = process.env.CLOUDINARY_API_KEY;
  // const apiSecret = process.env.CLOUDINARY_API_SECRET;

  // const hasCloudinary =
  //   cloudName &&
  //   apiKey &&
  //   apiSecret &&
  //   !cloudName.includes('your_') &&
  //   cloudName.trim() !== '';

  const hasCloudinary =
  cloudName &&
  apiKey &&
  apiSecret &&
  !cloudName.includes('your_') &&
  cloudName !== '';
  if (hasCloudinary) {
    try {
      const uploadResult = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'image',
            format: 'png',
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(buffer);
      });

      if (uploadResult && uploadResult.secure_url) {
        return uploadResult.secure_url;
      }
    } catch (err: any) {
      console.warn('⚠️ Cloudinary upload failed, falling back to local storage:', err.message || err);
    }
  }

  // Fallback: Save to local public/uploads directory
  const fileName = `${filenamePrefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.png`;
  const filePath = path.join(UPLOAD_DIR, fileName);
  fs.writeFileSync(filePath, buffer);

  // Return server-relative URL
  const serverBase = process.env.SERVER_BASE_URL || 'http://localhost:5000';
  return `${serverBase}/uploads/${fileName}`;
}

export default {
  uploadImageBuffer,
};

import { registerAs } from '@nestjs/config';
import * as dotenv from 'dotenv';
dotenv.config();

export default registerAs('production', () => ({
  mongodbConnectionUrl: process.env.DEV_MONGODB_CONNECTION_URL,
  jwt: {
    privateKey: process.env.JWT_PRIVATE_KEY,
    publicKey: process.env.JWT_PUBLIC_KEY,
    expiresIn: process.env.JWT_EXPIRES_IN,
    issuer: process.env.JWT_ISSUER,
  },
  mail: {
    // Mailing service configuration for production environment
    // GMAIL, SENDGRID, BREVO, etc.
  },
  cloudinary: {
    name: process.env.CLOUDINARY_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  
}));

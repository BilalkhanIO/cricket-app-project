// backend/config.js
import { configDotenv } from "dotenv";
configDotenv()
export const PORT = process.env.PORT || 5000;
export const MONGODB_URI = process.env.MONGODB_URI;
export const SECRET_KEY = process.env.SECRET_KEY || 'secretkey123';
export const JWT_EXPIRES_IN = '30d'; // 30 days
export const JWT_COOKIE_EXPIRES_IN = 30 * 24 * 60 * 60 * 1000; // 30 days
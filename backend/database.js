// backend/db.js

import { mongoose } from 'mongoose';
import { MONGODB_URI } from './config.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI);

    console.log(`MongoDB Connected`);
  } catch (error) {
    console.error(`Error connecting to MongoDB`);
    process.exit(1); // Exit process with failure
  }
};

export default connectDB ;
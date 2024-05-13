// backend/server.js

import express from 'express';
import connectDB from './database.js'; // Import the database connection function
import { PORT } from './config.js'; // Import the port variable
import router from './routes/index.js'; // Import the router from the index file
import errorHandler from './middlewares/errorHandler.js';

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(errorHandler)

// Routes
app.use('/api', router);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

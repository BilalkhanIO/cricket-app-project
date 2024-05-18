// backend/server.js

import express from 'express';
import bodyParser from 'body-parser';
import connectDB from './database.js'; // Import the database connection function
import cors from 'cors';
import { PORT } from './config.js'; // Import the port variable
import router from './routes/index.js'; // Import the router from the index file
import errorHandler from './middlewares/errorHandler.js';

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads'));;

// Routes
app.use('/api', router);

//error Handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

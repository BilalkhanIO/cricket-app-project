import express from 'express';
import UserController from '../controllers/userController.js';

const router = express.Router();

// User registration route
router.post('/register', UserController.registerUser);

// User login route
router.post('/login', UserController.loginUser);

// Get user profile route
router.get('/profile', UserController.getUserProfile);

export default router;

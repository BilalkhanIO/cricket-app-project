// backend/routes/userRoutes.js

import express from 'express';
import UserController from '../controllers/userController.js';

const router = express.Router();

router.post('/register', UserController.registerUser);
router.post('/login', UserController.loginUser);
router.get('/profile', UserController.getUserProfile);
router.put('/profile', UserController.updateUserProfile);
router.delete('/profile', UserController.deleteUser);
router.post('/password-reset', UserController.requestPasswordReset);
router.post('/reset-password', UserController.resetPassword);

export default router;
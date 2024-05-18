import express from 'express';
import UserController from '../controllers/userController.js';
import { upload } from '../middlewares/fileUpload.js';
import verifyToken from '../middlewares/authMiddleware.js';
const router = express.Router();

router.post('/register', UserController.registerUser);
router.post('/login', UserController.loginUser);
router.get('/profile', verifyToken, UserController.getUserProfile);
router.put('/profile', verifyToken, upload.single('profilePicture'), UserController.updateUserProfile);
router.delete('/profile', verifyToken, UserController.deleteUser);
router.post('/request-password-reset', UserController.requestPasswordReset);
router.post('/reset-password', UserController.resetPassword);

export default router;

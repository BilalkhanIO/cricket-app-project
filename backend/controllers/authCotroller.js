// backend/controllers/authController.js

import User from '../models/userModel.js';
import jwt from 'jsonwebtoken';
import config from '../config.js'

const AuthController = {
  async requestPasswordReset(req, res) {
    try {
      const { email } = req.body;

      // Check if the user exists
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Generate a reset token
      const resetToken = jwt.sign({ userId: user._id }, , { expiresIn: '1h' });

      // Send reset email (send email logic goes here)

      res.status(200).json({ message: 'Password reset email sent successfully' });
    } catch (error) {
      console.error('Error requesting password reset:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },
};

export default AuthController;

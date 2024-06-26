import User from '../models/userModel.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import fs from 'fs';
import { SECRET_KEY } from '../config.js';

const UserController = {
  async registerUser(req, res) {
    try {
      const { name, email, password, role, contactNumber } = req.body;
      const profilePicture = req.file ? req.file.path : null;

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = new User({ name, email, password: hashedPassword, role, contactNumber, profilePicture });
      await user.save();

      res.status(201).json({ message: 'User registered successfully', user });
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).json({ message: 'An error occurred while registering user' });
    }
  },

  async loginUser(req, res) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });

      if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const token = jwt.sign({ userId: user._id }, SECRET_KEY, { expiresIn: '1d' });

      res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
      console.error('Error logging in user:', error);
      res.status(500).json({ message: 'An error occurred while logging in user' });
    }
  },

  async getUserProfile(req, res) {
    try {
      const userId = req.user.userId;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json({ user });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ message: 'An error occurred while fetching user profile' });
    }
  },

  async updateUserProfile(req, res) {
    try {
      const userId = req.user.userId;
      const { name, email, contactNumber } = req.body;
      let profilePicture = req.user.profilePicture;

      if (req.file) {
        if (req.user.profilePicture) {
          fs.unlinkSync(req.user.profilePicture);
        }
        profilePicture = req.file.path;
      }

      const updatedUser = await User.findByIdAndUpdate(userId, { name, email, contactNumber, profilePicture }, { new: true, runValidators: true });

      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json({ message: 'User profile updated successfully', user: updatedUser });
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ message: 'An error occurred while updating user profile' });
    }
  },

  async deleteUser(req, res) {
    try {
      const userId = req.user.userId;
      const deletedUser = await User.findByIdAndDelete(userId);

      if (!deletedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (deletedUser.profilePicture) {
        fs.unlinkSync(deletedUser.profilePicture);
      }

      res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'An error occurred while deleting user' });
    }
  },

  async requestPasswordReset(req, res) {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const resetToken = crypto.randomBytes(20).toString('hex');
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = Date.now() + 3600000;
      await user.save();

      // Send reset email logic goes here

      res.status(200).json({ message: 'Password reset email sent successfully' });
    } catch (error) {
      console.error('Error requesting password reset:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  async resetPassword(req, res) {
    try {
      const { resetToken, password } = req.body;

      const user = await User.findOne({
        resetPasswordToken: resetToken,
        resetPasswordExpires: { $gt: Date.now() },
      });

      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }

      user.password = await bcrypt.hash(password, 10);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
      console.error('Error resetting password:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },
};

export default UserController;

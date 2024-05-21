// backend/models/user.model.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  profilePicture: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'manager', 'player'], default: 'player' },
  contactNumber: { type: String },
  registrationDate: { type: Date, default: Date.now },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
});

const User = mongoose.model('User', userSchema);

export default User;
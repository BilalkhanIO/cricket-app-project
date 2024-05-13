// backend/models/user.model.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'manager', 'player'], default: 'player' },
  profilePicture: { type: String },
  contactNumber: { type: String },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
});

const User = mongoose.model('User', userSchema);

export default User;
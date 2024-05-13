// backend/models/player.model.js
import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  imageUrl: { type: String },
  bio: { type: String },
  playerType: { type: String, enum: ['batsman', 'bowler', 'all_rounder', 'wicket_keeper'] },
  team: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
  seasonRecords: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SeasonRecord' }],
  overallRecords: { type: Object },
  matchStats: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MatchStats' }],
  registrationDate: { type: Date, default: Date.now },
});

const Player = mongoose.model('Player', playerSchema);

export default Player;
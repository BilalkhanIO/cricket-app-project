// backend/models/team.model.js
import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  league: { type: mongoose.Schema.Types.ObjectId, ref: 'League', required: true },
  season: { type: mongoose.Schema.Types.ObjectId, ref: 'Season', required: true },
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
  logo: { type: String },
  jerseyColor: { type: String },
  standings: { type: Object },
  matchHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Match' }],
  captain: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
});

const Team = mongoose.model('Team', teamSchema);

export default Team;
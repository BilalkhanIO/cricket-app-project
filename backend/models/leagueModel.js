// backend/models/league.model.js
import mongoose from 'mongoose';

const leagueSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  leagueLogo: { type: String },
  seasons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Season' }],
  teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
  matches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Match' }],
  settings: { type: Object },
});

const League = mongoose.model('League', leagueSchema);

export default League;
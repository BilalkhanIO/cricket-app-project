// backend/models/matchStats.model.js
import mongoose from 'mongoose';

const matchStatsSchema = new mongoose.Schema({
  player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
  match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
  runsScored: { type: Number, default: 0 },
  ballsFaced: { type: Number, default: 0 },
  fours: { type: Number, default: 0 },
  sixes: { type: Number, default: 0 },
  strikeRate: { type: Number, default: 0 },
  wicketsTaken: { type: Number, default: 0 },
  runsConceded: { type: Number, default: 0 },
  overs: { type: Number, default: 0 },
  maidens: { type: Number, default: 0 },
  economy: { type: Number, default: 0 },
  catches: { type: Number, default: 0 },
  stumpings: { type: Number, default: 0 },
});

const MatchStats = mongoose.model('MatchStats', matchStatsSchema);

export default MatchStats;
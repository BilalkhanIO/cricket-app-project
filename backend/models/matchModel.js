// backend/models/match.model.js

import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
  season: { type: mongoose.Schema.Types.ObjectId, ref: 'Season', required: true },
  league: { type: mongoose.Schema.Types.ObjectId, ref: 'League', required: true },
  team1: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  team2: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  venue: { type: String, required: true },
  date: { type: Date, required: true },
  toss: { type: Object },
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  scorecard: { type:mongoose.Schema.Types.ObjectId,ref: 'Score' },
  bowling: { type: Object },
  batting: { type: Object },
  scorecard: { type: Object },
  result: { type: Object },
  manOfTheMatch: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
});

const Match = mongoose.model('Match', matchSchema);

export default Match;

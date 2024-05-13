// backend/models/season.model.js

import mongoose from 'mongoose';

const seasonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  league: { type: mongoose.Schema.Types.ObjectId, ref: 'League', required: true },
  matches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Match' }],
  standings: { type: Object },
  schedule: { type: Object },
});

const Season = mongoose.model('Season', seasonSchema);

export default Season;

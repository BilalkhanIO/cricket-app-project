// backend/models/seasonRecord.model.js
import mongoose from 'mongoose';

const seasonRecordSchema = new mongoose.Schema({
  player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
  season: { type: mongoose.Schema.Types.ObjectId, ref: 'Season', required: true },
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

const SeasonRecord = mongoose.model('SeasonRecord', seasonRecordSchema);

export default SeasonRecord;
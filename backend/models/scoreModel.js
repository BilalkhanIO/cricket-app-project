import mongoose from 'mongoose';

const scoreSchema = new mongoose.Schema({
  innings: [{
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    runs: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    overs: { type: Number, default: 0 },
    batting: [{
      batsman: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
      runsScored: { type: Number, default: 0 },
      strikeRate: { type: Number, default: 0 },
      fours: { type: Number, default: 0 },
      sixes: { type: Number, default: 0 },
    }],
    bowling: [{
      bowler: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
      overs: { type: Number, default: 0 },
      wickets: { type: Number, default: 0 },
      runsConceded: { type: Number, default: 0 },
      economy: { type: Number, default: 0 },
    }],
  }],
});
const Score = mongoose.model('Score', scoreSchema);
export default Score;
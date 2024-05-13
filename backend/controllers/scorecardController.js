// backend/controllers/scoreController.js

import Scorecard from '../models/scorecardModel.js';

const ScoreController = {
  async createScorecard(req, res) {
    try {
      const { matchId, innings } = req.body;

      const scorecard = new Scorecard({
        match: matchId,
        innings,
      });

      await scorecard.save();

      res.status(201).json({ message: 'Scorecard created successfully', scorecard });
    } catch (error) {
      console.error('Error creating scorecard:', error);
      res.status(500).json({ message: 'An error occurred while creating scorecard' });
    }
  },

  async getAllScoreboards(req, res) {
    try {
      const scorecards = await Scorecard.find().populate('match').populate('innings.team').populate('innings.batting.batsman').populate('innings.bowling.bowler');
      res.status(200).json({ scorecards });
    } catch (error) {
      console.error('Error fetching scorecards:', error);
      res.status(500).json({ message: 'An error occurred while fetching scorecards' });
    }
  },

  async getScoreboardById(req, res) {
    try {
      const scorecardId = req.params.id;
      const scorecard = await Scorecard.findById(scorecardId).populate('match').populate('innings.team').populate('innings.batting.batsman').populate('innings.bowling.bowler');

      if (!scorecard) {
        return res.status(404).json({ message: 'Scorecard not found' });
      }

      res.status(200).json({ scorecard });
    } catch (error) {
      console.error('Error fetching scorecard by ID:', error);
      res.status(500).json({ message: 'An error occurred while fetching scorecard' });
    }
  },

  async updateScorecard(req, res) {
    try {
      const scorecardId = req.params.id;
      const { innings } = req.body;

      const updatedScorecard = await Scorecard.findByIdAndUpdate(scorecardId, { innings }, { new: true, runValidators: true });

      if (!updatedScorecard) {
        return res.status(404).json({ message: 'Scorecard not found' });
      }

      res.status(200).json({ message: 'Scorecard updated successfully', scorecard: updatedScorecard });
    } catch (error) {
      console.error('Error updating scorecard:', error);
      res.status(500).json({ message: 'An error occurred while updating scorecard' });
    }
  },

  async deleteScorecard(req, res) {
    try {
      const scorecardId = req.params.id;
      const deletedScorecard = await Scorecard.findByIdAndDelete(scorecardId);

      if (!deletedScorecard) {
        return res.status(404).json({ message: 'Scorecard not found' });
      }

      res.status(200).json({ message: 'Scorecard deleted successfully' });
    } catch (error) {
      console.error('Error deleting scorecard:', error);
      res.status(500).json({ message: 'An error occurred while deleting scorecard' });
    }
  },
};

export default ScoreController;
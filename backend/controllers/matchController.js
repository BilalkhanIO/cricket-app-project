// backend/controllers/matchController.js

import Match from '../models/matchModel.js';

const MatchController = {
  async createMatch(req, res) {
    try {
      const { seasonId, leagueId, team1, team2, venue, date, toss, decision, matchDuration, bowling, batting, scorecard, result, manOfTheMatch } = req.body;

      const match = new Match({
        seasonId,
        leagueId,
        team1,
        team2,
        venue,
        date,
        toss,
        decision,
        matchDuration,
        bowling,
        batting,
        scorecard,
        result,
        manOfTheMatch,
      });

      await match.save();

      res.status(201).json({ message: 'Match created successfully', match });
    } catch (error) {
      console.error('Error creating match:', error);
      res.status(500).json({ message: 'An error occurred while creating match' });
    }
  },
  async getAllMatches(req, res) {
    try {
      const matches = await Match.find().populate('season').populate('league').populate('team1').populate('team2');
      res.status(200).json({ matches });
    } catch (error) {
      console.error('Error fetching matches:', error);
      res.status(500).json({ message: 'An error occurred while fetching matches' });
    }
  },
  async getMatchById(req, res) {
    try {
      const matchId = req.params.id;
      const match = await Match.findById(matchId).populate('season').populate('league').populate('team1').populate('team2');

      if (!match) {
        return res.status(404).json({ message: 'Match not found' });
      }

      res.status(200).json({ match });
    } catch (error) {
      console.error('Error fetching match by ID:', error);
      res.status(500).json({ message: 'An error occurred while fetching match' });
    }
  },
  async updateMatch(req, res) {
    try {
      const matchId = req.params.id;
      const { seasonId, leagueId, team1, team2, venue, date, toss, decision, matchDuration, bowling, batting, scorecard, result, manOfTheMatch } = req.body;

      const updatedMatch = await Match.findByIdAndUpdate(matchId, { seasonId, leagueId, team1, team2, venue, date, toss, decision, matchDuration, bowling, batting, scorecard, result, manOfTheMatch }, { new: true, runValidators: true });

      if (!updatedMatch) {
        return res.status(404).json({ message: 'Match not found' });
      }

      res.status(200).json({ message: 'Match updated successfully', match: updatedMatch });
    } catch (error) {
      console.error('Error updating match:', error);
      res.status(500).json({ message: 'An error occurred while updating match' });
    }
  },
  async deleteMatch(req, res) {
    try {
      const matchId = req.params.id;
      const deletedMatch = await Match.findByIdAndDelete(matchId);

      if (!deletedMatch) {
        return res.status(404).json({ message: 'Match not found' });
      }

      res.status(200).json({ message: 'Match deleted successfully' });
    } catch (error) {
      console.error('Error deleting match:', error);
      res.status(500).json({ message: 'An error occurred while deleting match' });
    }
  },
};

export default MatchController;
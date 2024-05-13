// backend/controllers/matchStatsController.js

import MatchStats from '../models/matchStatsModel.js';

const MatchStatsController = {
  async createMatchStats(req, res) {
    try {
      const { playerId, matchId, stats } = req.body;

      const matchStats = new MatchStats({
        player: playerId,
        match: matchId,
        ...stats,
      });

      await matchStats.save();

      res.status(201).json({ message: 'Match stats created successfully', matchStats });
    } catch (error) {
      console.error('Error creating match stats:', error);
      res.status(500).json({ message: 'An error occurred while creating match stats' });
    }
  },

  async getAllMatchStats(req, res) {
    try {
      const matchStats = await MatchStats.find().populate('player').populate('match');
      res.status(200).json({ matchStats });
    } catch (error) {
      console.error('Error fetching match stats:', error);
      res.status(500).json({ message: 'An error occurred while fetching match stats' });
    }
  },

  async getMatchStatsByPlayer(req, res) {
    try {
      const playerId = req.params.id;
      const matchStats = await MatchStats.find({ player: playerId }).populate('player').populate('match');
      res.status(200).json({ matchStats });
    } catch (error) {
      console.error('Error fetching match stats by player:', error);
      res.status(500).json({ message: 'An error occurred while fetching match stats by player' });
    }
  },

  async getMatchStatsByMatch(req, res) {
    try {
      const matchId = req.params.id;
      const matchStats = await MatchStats.find({ match: matchId }).populate('player').populate('match');
      res.status(200).json({ matchStats });
    } catch (error) {
      console.error('Error fetching match stats by match:', error);
      res.status(500).json({ message: 'An error occurred while fetching match stats by match' });
    }
  },
};

export default MatchStatsController;
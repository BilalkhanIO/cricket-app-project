// backend/controllers/seasonRecordController.js

import SeasonRecord from '../models/seasonRecordModel.js';

const SeasonRecordController = {
  async createSeasonRecord(req, res) {
    try {
      const { playerId, seasonId, stats } = req.body;

      const seasonRecord = new SeasonRecord({
        player: playerId,
        season: seasonId,
        ...stats,
      });

      await seasonRecord.save();

      res.status(201).json({ message: 'Season record created successfully', seasonRecord });
    } catch (error) {
      console.error('Error creating season record:', error);
      res.status(500).json({ message: 'An error occurred while creating season record' });
    }
  },

  async getAllSeasonRecords(req, res) {
    try {
      const seasonRecords = await SeasonRecord.find().populate('player').populate('season');
      res.status(200).json({ seasonRecords });
    } catch (error) {
      console.error('Error fetching season records:', error);
      res.status(500).json({ message: 'An error occurred while fetching season records' });
    }
  },

  async getSeasonRecordsByPlayer(req, res) {
    try {
      const playerId = req.params.id;
      const seasonRecords = await SeasonRecord.find({ player: playerId }).populate('player').populate('season');
      res.status(200).json({ seasonRecords });
    } catch (error) {
      console.error('Error fetching season records by player:', error);
      res.status(500).json({ message: 'An error occurred while fetching season records by player' });
    }
  },

  async getSeasonRecordsBySeason(req, res) {
    try {
      const seasonId = req.params.id;
      const seasonRecords = await SeasonRecord.find({ season: seasonId }).populate('player').populate('season');
      res.status(200).json({ seasonRecords });
    } catch (error) {
      console.error('Error fetching season records by season:', error);
      res.status(500).json({ message: 'An error occurred while fetching season records by season' });
    }
  },
};

export default SeasonRecordController;
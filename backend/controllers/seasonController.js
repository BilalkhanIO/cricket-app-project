// backend/controllers/seasonController.js

import Season from '../models/seasonModel.js';

const SeasonController = {
  async createSeason(req, res) {
    try {
      const { name, startDate, endDate, leagueId } = req.body;

      const season = new Season({ name, startDate, endDate, league: leagueId });
      await season.save();

      res.status(201).json({ message: 'Season created successfully', season });
    } catch (error) {
      console.error('Error creating season:', error);
      res.status(500).json({ message: 'An error occurred while creating season' });
    }
  },

  async getAllSeasons(req, res) {
    try {
      const seasons = await Season.find().populate('league');
      res.status(200).json({ seasons });
    } catch (error) {
      console.error('Error fetching seasons:', error);
      res.status(500).json({ message: 'An error occurred while fetching seasons' });
    }
  },

  async getSeasonById(req, res) {
    try {
      const seasonId = req.params.id;
      const season = await Season.findById(seasonId).populate('league').populate('matches');

      if (!season) {
        return res.status(404).json({ message: 'Season not found' });
      }

      res.status(200).json({ season });
    } catch (error) {
      console.error('Error fetching season by ID:', error);
      res.status(500).json({ message: 'An error occurred while fetching season' });
    }
  },

  async updateSeason(req, res) {
    try {
      const seasonId = req.params.id;
      const { name, startDate, endDate, leagueId } = req.body;

      const updatedSeason = await Season.findByIdAndUpdate(seasonId, { name, startDate, endDate, league: leagueId }, { new: true, runValidators: true });

      if (!updatedSeason) {
        return res.status(404).json({ message: 'Season not found' });
      }

      res.status(200).json({ message: 'Season updated successfully', season: updatedSeason });
    } catch (error) {
      console.error('Error updating season:', error);
      res.status(500).json({ message: 'An error occurred while updating season' });
    }
  },

  async deleteSeason(req, res) {
    try {
      const seasonId = req.params.id;
      const deletedSeason = await Season.findByIdAndDelete(seasonId);

      if (!deletedSeason) {
        return res.status(404).json({ message: 'Season not found' });
      }

      res.status(200).json({ message: 'Season deleted successfully' });
    } catch (error) {
      console.error('Error deleting season:', error);
      res.status(500).json({ message: 'An error occurred while deleting season' });
    }
  },
};

export default SeasonController;
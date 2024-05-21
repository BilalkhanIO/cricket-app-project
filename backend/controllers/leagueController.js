import League from '../models/leagueModel.js';
import fs from 'fs';

const LeagueController = {
  async createLeague(req, res) {
    try {
      const { name, description } = req.body;
      const logo = req.file ? req.file.path : null;

      const league = new League({ name, description, logo });
      await league.save();

      res.status(201).json({ message: 'League created successfully', league });
    } catch (error) {
      console.error('Error creating league:', error);
      res.status(500).json({ message: 'An error occurred while creating the league' });
    }
  },

  async getAllLeagues(req, res) {
    try {
      const leagues = await League.find().populate('seasons').populate('teams').populate('matches');
      res.status(200).json({ leagues });
      console.log(leagues);
    } catch (error) {
      console.error('Error fetching leagues:', error);
      res.status(500).json({ message: 'An error occurred while fetching leagues' });
    }
  },

  async getLeagueById(req, res) {
    try {
      const leagueId = req.params.id;
      const league = await League.findById(leagueId).populate('seasons').populate('teams').populate('matches').lean();

      if (!league) {
        return res.status(404).json({ message: 'League not found' });
      }

      res.status(200).json({ league });
    } catch (error) {
      console.error('Error fetching league:', error);
      res.status(500).json({ message: 'An error occurred while fetching the league' });
    }
  },

  async updateLeague(req, res) {
    try {
      const leagueId = req.params.id;
      const { name, description } = req.body;

      // Fetch the existing league
      const existingLeague = await League.findById(leagueId);

      if (!existingLeague) {
        return res.status(404).json({ message: 'League not found' });
      }

      let logo = existingLeague.logo; // Use the existing logo

      if (req.file) {
        // If a new file is uploaded, delete the old logo file
        if (logo) {
          fs.unlinkSync(logo);
        }
        logo = req.file.path;
      }

      // Update the league with the new data
      existingLeague.name = name;
      existingLeague.description = description;
      existingLeague.logo = logo;

      await existingLeague.save();

      res.status(200).json({ message: 'League updated successfully', league: existingLeague });
    } catch (error) {
      console.error('Error updating league:', error);
      res.status(500).json({ message: 'An error occurred while updating the league', error });
    }
  },

  async deleteLeague(req, res) {
    try {
      const leagueId = req.params.id;
      const deletedLeague = await League.findByIdAndDelete(leagueId);

      if (!deletedLeague) {
        return res.status(404).json({ message: 'League not found' });
      }

      res.status(200).json({ message: 'League deleted successfully' });
    } catch (error) {
      console.error('Error deleting league:', error);
      res.status(500).json({ message: 'An error occurred while deleting the league' });
    }
  },
};

export default LeagueController;

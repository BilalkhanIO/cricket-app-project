// backend/controllers/leagueController.js

import League from '../models/leagueModel.js';
import { validationResult } from 'express-validator';
import { upload, deleteOldFile } from '../middlewares/fileUpload.js';

const LeagueController = {
    async createLeague(req, res) {
      try {
        const { name, country, logo } = req.body;
        const leagueLogo = req.file ? req.file.path : null;
  
        const league = new League({ name, country, logo: leagueLogo });
        await league.save();
  
        res.status(201).json({ message: 'League created successfully', league });
      } catch (error) {
        console.error('Error creating league:', error);
        res.status(500).json({ message: 'An error occurred while creating league' });
      }
    },
  async getAllLeagues(req, res, next) {
    try {
      const leagues = await League.find().populate('seasons').populate('teams').populate('matches');
      res.status(200).json({ leagues });
    } catch (error) {
      next(error);
    }
  },
  async getLeagueById(req, res, next) {
    try {
      const leagueId = req.params.id;
      const league = await League.findById(leagueId).populate('seasons').populate('teams').populate('matches');

      if (!league) {
        return next({ status: 404, message: 'League not found' });
      }

      res.status(200).json({ league });
    } catch (error) {
      next(error);
    }
  },
  async updateLeague(req, res) {
    try {
      const leagueId = req.params.id;
      const { name, country } = req.body;
      let logo = req.league.logo;

      if (req.file) {
        // Delete the old file
        deleteOldFile(req.league.logo);
        logo = req.file.path;
      }

      const updatedLeague = await League.findByIdAndUpdate(leagueId, { name, country, logo }, { new: true, runValidators: true });

      if (!updatedLeague) {
        return res.status(404).json({ message: 'League not found' });
      }

      res.status(200).json({ message: 'League updated successfully', league: updatedLeague });
    } catch (error) {
      console.error('Error updating league:', error);
      res.status(500).json({ message: 'An error occurred while updating league' });
    }
  },
  async deleteLeague(req, res, next) {
    try {
      const leagueId = req.params.id;
      const deletedLeague = await League.findByIdAndDelete(leagueId);

      if (!deletedLeague) {
        return next({ status: 404, message: 'League not found' });
      }

      res.status(200).json({ message: 'League deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
};

export default LeagueController;
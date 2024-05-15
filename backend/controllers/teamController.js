// backend/controllers/teamController.js

import Team from '../models/teamModel.js';

const TeamController = {
  async createTeam(req, res) {
    try {
      const { name, leagueId, seasonId, players, jerseyColor, standings } = req.body;
      const logo = req.file ? req.file.path : null;

      const team = new Team({
        name,
        league: leagueId,
        season: seasonId,
        players,
        logo,
        jerseyColor,
        standings,
      });

      await team.save();

      res.status(201).json({ message: 'Team created successfully', team });
    } catch (error) {
      console.error('Error creating team:', error);
      res.status(500).json({ message: 'An error occurred while creating team' });
    }
  },
  async getAllTeams(req, res) {
    try {
      const teams = await Team.find().populate('league').populate('season').populate('players');
      res.status(200).json({ teams });
    } catch (error) {
      console.error('Error fetching teams:', error);
      res.status(500).json({ message: 'An error occurred while fetching teams' });
    }
  },

  async getTeamById(req, res) {
    try {
      const teamId = req.params.id;
      const team = await Team.findById(teamId).populate('league').populate('season').populate('players');

      if (!team) {
        return res.status(404).json({ message: 'Team not found' });
      }

      res.status(200).json({ team });
    } catch (error) {
      console.error('Error fetching team by ID:', error);
      res.status(500).json({ message: 'An error occurred while fetching team' });
    }
  },

  async updateTeam(req, res) {
    try {
      const teamId = req.params.id;
      const { name, leagueId, seasonId, players, jerseyColor, standings } = req.body;
      let logo = req.team.logo;

      if (req.file) {
        // Delete the old file
        deleteOldFile(req.team.logo);
        logo = req.file.path;
      }

      const updatedTeam = await Team.findByIdAndUpdate(teamId, { name, league: leagueId, season: seasonId, players, logo, jerseyColor, standings }, { new: true, runValidators: true });

      if (!updatedTeam) {
        return res.status(404).json({ message: 'Team not found' });
      }

      res.status(200).json({ message: 'Team updated successfully', team: updatedTeam });
    } catch (error) {
      console.error('Error updating team:', error);
      res.status(500).json({ message: 'An error occurred while updating team' });
    }
  },

  async deleteTeam(req, res) {
    try {
      const teamId = req.params.id;
      const deletedTeam = await Team.findByIdAndDelete(teamId);

      if (!deletedTeam) {
        return res.status(404).json({ message: 'Team not found' });
      }

      res.status(200).json({ message: 'Team deleted successfully' });
    } catch (error) {
      console.error('Error deleting team:', error);
      res.status(500).json({ message: 'An error occurred while deleting team' });
    }
  },
};

export default TeamController;
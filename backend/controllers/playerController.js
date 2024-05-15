// backend/controllers/playerController.js

import Player from '../models/playerModel.js';

const PlayerController = {
  async createPlayer(req, res) {
    try {
      const { name, bio, playerType, teamId } = req.body;
      const playerImage = req.file.path;

      const player = new Player({ name, bio, playerType, team: teamId, playerImage });
      await player.save();

      res.status(201).json({ message: 'Player created successfully', player });
    } catch (error) {
      console.error('Error creating player:', error);
      res.status(500).json({ message: 'An error occurred while creating player' });
    }
  },

  async getAllPlayers(req, res) {
    try {
      const players = await Player.find().populate('team').populate('seasonRecords').populate('matchStats');
      res.status(200).json({ players });
    } catch (error) {
      console.error('Error fetching players:', error);
      res.status(500).json({ message: 'An error occurred while fetching players' });
    }
  },

  async getPlayerById(req, res) {
    try {
      const playerId = req.params.id;
      const player = await Player.findById(playerId).populate('team').populate('seasonRecords').populate('matchStats');

      if (!player) {
        return res.status(404).json({ message: 'Player not found' });
      }

      res.status(200).json({ player });
    } catch (error) {
      console.error('Error fetching player by ID:', error);
      res.status(500).json({ message: 'An error occurred while fetching player' });
    }
  },

  async updatePlayer(req, res) {
    try {
      const playerId = req.params.id;
      const { name, bio, playerType, teamId } = req.body;
      let playerImage = req.player.playerImage;

      if (req.file) {
        // Delete the old file
        deleteOldFile(req.player.playerImage);
        playerImage = req.file.path;
      }

      const updatedPlayer = await Player.findByIdAndUpdate(playerId, { name, bio, playerType, team: teamId, playerImage }, { new: true, runValidators: true });

      if (!updatedPlayer) {
        return res.status(404).json({ message: 'Player not found' });
      }

      res.status(200).json({ message: 'Player updated successfully', player: updatedPlayer });
    } catch (error) {
      console.error('Error updating player:', error);
      res.status(500).json({ message: 'An error occurred while updating player' });
    }
  },

  async deletePlayer(req, res) {
    try {
      const playerId = req.params.id;
      const deletedPlayer = await Player.findByIdAndDelete(playerId);

      if (!deletedPlayer) {
        return res.status(404).json({ message: 'Player not found' });
      }

      res.status(200).json({ message: 'Player deleted successfully' });
    } catch (error) {
      console.error('Error deleting player:', error);
      res.status(500).json({ message: 'An error occurred while deleting player' });
    }
  },
};

export default PlayerController;
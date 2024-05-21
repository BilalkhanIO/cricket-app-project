// backend/controllers/playerController.js

import Player from '../models/playerModel.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import fs from 'fs';
import { SECRET_KEY } from '../config.js';


const PlayerController = {
  async registerPlayer(req, res) {
    try {
      const { name, playerType, email, password } = req.body;
      console.log(req.body)
      const existingPlayer = await Player.findOne({email});
      if (existingPlayer) {
        return res.status(409).json({ message: 'Player already exists' });
      }
      const hashedPassword = await bcrypt.hash(password, 10);

      const player = new Player({ name, playerType, password: hashedPassword, email});
      await player.save();

      res.status(201).json({ message: 'Player registered successfully', player });
    } catch (error) {
      console.error('Error regsitereing player:', error);
      res.status(500).json({ message: 'An error occurred while registering player' });
    }
  },

  async loginPlayer(req, res){
    
    try {
      const { email, password } = req.body;

      const player = await Player.findOne({email});

      if (!player || !await bcrypt.compare(password, Player.password)) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const token = jwt.sign({ id: player._id }, SECRET_KEY, { expiresIn: '1d' });

      res.status(200).json({message: 'Login successful', token });

    } catch (error) {
      console.error('Error logging in player:', error);
      res.status(500).json({ message: 'An error occurred while logging in player' });
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
    const Id = req.params.id;
    const { name, bio, playerType, email } = req.body;
    let playerImage = req.player.playerImage;

    try {
        const player = await Player.findOne({Id});
        if (!player) {
          return res.status(404).json({ message: 'Player not found' });
        }
      if (req.file) {
        // Delete the old file
        if(req.player.playerImage){
          fs.unlinkSync(req.player.playerImage);
        }
        playerImage = req.file.path;
      }

      const updatedPlayer = await Player.findByIdAndUpdate(Id, { name, bio, playerType, team: teamId, playerImage }, { new: true, runValidators: true });

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
      if(deletedPlayer.playerImage){
        fs.unlinkSync(deletedPlayer.playerImage);
      }

      res.status(200).json({ message: 'Player deleted successfully' });
    } catch (error) {
      console.error('Error deleting player:', error);
      res.status(500).json({ message: 'An error occurred while deleting player' });
    }
  },
};

export default PlayerController;
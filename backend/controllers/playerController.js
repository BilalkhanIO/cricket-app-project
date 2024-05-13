// backend/controllers/playerController.js

import Player from '../models/playerModel.js';
import upload from '../middlewares/fileUpload.js';

const uploadPlayerImage = upload.single('playerImage');
// Create a new player
const createPlayer = async (req, res) => {
  try {
    const { name, age, teamId } = req.body;
    const imageUrl = req.file.path;
    const player = new Player({ name, age, team: teamId, imageUrl });
    await player.save();
    res.status(201).json(player);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a player by ID
const getPlayerById = async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }
    res.json(player);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a player
const updatePlayer = async (req, res) => {
  try {
    const playerId = req.params.id;
    const { name, age, teamId } = req.body;

    let imageUrl = '';
    if (req.file) {
      imageUrl = req.file.path;
    }else{
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }
    imageUrl = player.imageUrl;
    }

    const player = await Player.findById(playerId);
    player.name = name;
    player.age = age;
    player.team = teamId;
    player.imageUrl = imageUrl;
    await player.save();
    res.json(player);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a player
const deletePlayer = async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }
    await player.remove();
    res.json({ message: 'Player deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all players
const getAllPlayers = async (req, res) => {
  try {
    const players = await Player.find();
    res.json(players);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export { createPlayer, getPlayerById, updatePlayer, deletePlayer, getAllPlayers };

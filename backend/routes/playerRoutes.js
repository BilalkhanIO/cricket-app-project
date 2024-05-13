// backend/routes/playerRoutes.js

import express from 'express';
import { createPlayer, getPlayerById, updatePlayer, deletePlayer, getAllPlayers, uploadPlayerImage } from '../controllers/playerController.js';

const playerRoutes = express.Router();

// Create a new player
playerRoutes.post('/', uploadPlayerImage, createPlayer);

// Get a player by ID
playerRoutes.get('/:id', getPlayerById);

// Update a player
playerRoutes.put('/:id', updatePlayer);

// Delete a player
playerRoutes.delete('/:id', deletePlayer);

// Get all players
playerRoutes.get('/', getAllPlayers);

export default playerRoutes;

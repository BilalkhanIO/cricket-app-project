import express from 'express';
import SeasonController from '../controllers/seasonController.js';

const router = express.Router();

// Create a new season
router.post('/', SeasonController.createSeason);

// Get all seasons
router.get('/', SeasonController.getAllSeasons);

// Get season by ID
router.get('/:id', SeasonController.getSeasonById);

export default router;

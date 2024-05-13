import express from 'express';
import LeagueController from '../controllers/leagueController.js';
import upload from '../middlewares/fileUpload.js';

const router = express.Router();

// Create a new league
router.post('/', upload.single('leagueLogo'),  LeagueController.createLeague);

// Get all leagues
router.get('/', LeagueController.getAllLeagues);

// Get league by ID
router.get('/:id', LeagueController.getLeagueById);

export default router;

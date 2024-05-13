import express from 'express';
import MatchController from '../controllers/matchController.js';

const router = express.Router();

// Create a new match
router.post('/', MatchController.createMatch);

// Get all matches
router.get('/', MatchController.getAllMatches);

// Get match by ID
router.get('/:id', MatchController.getMatchById);

export default router;

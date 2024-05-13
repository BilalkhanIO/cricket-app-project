import express from 'express';
import ScoreController from '../controllers/scoreController.js';

const router = express.Router();

// Create a new score
router.post('/', ScoreController.createScore);

// Get all scores
router.get('/', ScoreController.getAllScores);

// Get score by ID
router.get('/:id', ScoreController.getScoreById);

export default router;

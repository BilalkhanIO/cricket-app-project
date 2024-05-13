// backend/routes/scorecardRoutes.js

import express from 'express';
import ScoreController from '../controllers/scoreController.js';

const router = express.Router();

router.post('/create', ScoreController.createScorecard);
router.get('/', ScoreController.getAllScoreboards);
router.get('/:id', ScoreController.getScoreboardById);
router.put('/:id', ScoreController.updateScorecard);
router.delete('/:id', ScoreController.deleteScorecard);

export default router;
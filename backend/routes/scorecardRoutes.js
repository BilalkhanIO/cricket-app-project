// backend/routes/scorecardRoutes.js

import express from 'express';
import ScorecardController from '../controllers/scorecardController.js';

const router = express.Router();

router.post('/create', ScorecardController.createScorecard);
router.get('/', ScorecardController.getAllScoreboards);
router.get('/:id', ScorecardController.getScoreboardById);
router.put('/:id', ScorecardController.updateScorecard);
router.delete('/:id', ScorecardController.deleteScorecard);

export default router;
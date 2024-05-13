// backend/routes/matchStatsRoutes.js

import express from 'express';
import MatchStatsController from '../controllers/matchStatsController.js';

const router = express.Router();

router.post('/create', MatchStatsController.createMatchStats);
router.get('/', MatchStatsController.getAllMatchStats);
router.get('/player/:id', MatchStatsController.getMatchStatsByPlayer);
router.get('/match/:id', MatchStatsController.getMatchStatsByMatch);

export default router;
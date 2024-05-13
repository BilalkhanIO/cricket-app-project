// backend/routes/index.js

import express from 'express';
import playerRoutes from './playerRoutes.js';
import teamRoutes from './teamRoutes.js';
import seasonRoutes from './seasonRoutes.js';
import leagueRoutes from './leagueRoutes.js';
import matchRoutes from './MatcheRoutes.js';
import scoreRoutes from './scoreRoutes.js';

const router = express.Router();

// Mounting routes
router.use('/players', playerRoutes);
router.use('/teams', teamRoutes);
router.use('/seasons', seasonRoutes);
router.use('/leagues', leagueRoutes);
router.use('/matches', matchRoutes);
router.use('/scores', scoreRoutes);

export default router;

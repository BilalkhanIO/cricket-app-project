// backend/routes/index.js

import express from 'express';
import playerRoutes from './playerRoutes.js';
import teamRoutes from './teamRoutes.js';
import seasonRoutes from './seasonRoutes.js';
import leagueRoutes from './leagueRoutes.js';
import matchRoutes from './matchRoutes.js';
import userRoutes from './userRoutes.js';
import scorecardRoutes from './scorecardRoutes.js';
import seasonRecordRoutes from './seasonRecordRoutes.js';
import matchStatsRoutes from './matchStatsRoutes.js';

const router = express.Router();

// Mounting routes
router.use('/players', playerRoutes);
router.use('/teams', teamRoutes);
router.use('/seasons', seasonRoutes);
router.use('/leagues', leagueRoutes);
router.use('/matches', matchRoutes);
router.use('/user', userRoutes);
router.use('/score-card', scorecardRoutes); 
router.use('/season-record', seasonRecordRoutes); 
router.use('/match-stats', matchStatsRoutes); 

export default router;
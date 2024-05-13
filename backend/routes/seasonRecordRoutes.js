// backend/routes/seasonRecordRoutes.js

import express from 'express';
import SeasonRecordController from '../controllers/seasonRecordController.js';

const router = express.Router();

router.post('/create', SeasonRecordController.createSeasonRecord);
router.get('/', SeasonRecordController.getAllSeasonRecords);
router.get('/player/:id', SeasonRecordController.getSeasonRecordsByPlayer);
router.get('/season/:id', SeasonRecordController.getSeasonRecordsBySeason);

export default router;
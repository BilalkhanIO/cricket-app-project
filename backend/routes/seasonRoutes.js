// backend/routes/seasonRoutes.js

import express from 'express';
import SeasonController from '../controllers/seasonController.js';

const router = express.Router();

router.post('/create', SeasonController.createSeason);
router.get('/', SeasonController.getAllSeasons);
router.get('/:id', SeasonController.getSeasonById);
router.put('/:id', SeasonController.updateSeason);
router.delete('/:id', SeasonController.deleteSeason);

export default router;
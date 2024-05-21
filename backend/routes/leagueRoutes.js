// backend/routes/leagueRoutes.js

import express from 'express';
import LeagueController from '../controllers/leagueController.js';
import { upload } from '../middlewares/fileUpload.js';

const router = express.Router();

router.post('/create', upload.single('logo'), LeagueController.createLeague);
router.get('/', LeagueController.getAllLeagues);
router.get('/:id', LeagueController.getLeagueById);
router.put('/:id', upload.single('logo'), LeagueController.updateLeague);
router.delete('/:id', LeagueController.deleteLeague);

export default router;
// backend/routes/matchRoutes.js

import express from 'express';
import MatchController from '../controllers/matchController.js';

const router = express.Router();

router.post('/create', MatchController.createMatch);
router.get('/', MatchController.getAllMatches);
router.get('/:id', MatchController.getMatchById);
router.put('/:id', MatchController.updateMatch);
router.delete('/:id', MatchController.deleteMatch);

export default router;
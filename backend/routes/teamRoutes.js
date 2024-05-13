// backend/routes/teamRoutes.js

import express from 'express';
import TeamController from '../controllers/teamController.js';
import { upload } from '../middlewares/fileUpload.js';

const router = express.Router();

router.post('/create', upload.single('teamLogo'), TeamController.createTeam);
router.get('/', TeamController.getAllTeams);
router.get('/:id', TeamController.getTeamById);
router.put('/:id', upload.single('teamLogo'), TeamController.updateTeam);
router.delete('/:id', TeamController.deleteTeam);

export default router;
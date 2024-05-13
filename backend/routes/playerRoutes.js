// backend/routes/playerRoutes.js

import express from 'express';
import PlayerController from '../controllers/playerController.js';
import { upload } from '../middlewares/fileUpload.js';

const router = express.Router();

router.post('/create', upload.single('playerImage'), PlayerController.createPlayer);
router.get('/', PlayerController.getAllPlayers);
router.get('/:id', PlayerController.getPlayerById);
router.put('/:id', upload.single('playerImage'), PlayerController.updatePlayer);
router.delete('/:id', PlayerController.deletePlayer);

export default router;
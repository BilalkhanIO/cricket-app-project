// backend/routes/playerRoutes.js

import express from 'express';
import PlayerController from '../controllers/playerController.js';
import { upload } from '../middlewares/fileUpload.js';
import  verifyToken  from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register',PlayerController.registerPlayer);
router.post('/login', PlayerController.loginPlayer);
router.get('/players', PlayerController.getAllPlayers);
router.get('/:id', PlayerController.getPlayerById);
router.put('/:id', verifyToken, upload.single('playerImage'), PlayerController.updatePlayer);
router.delete('/:id',  PlayerController.deletePlayer);

export default router;
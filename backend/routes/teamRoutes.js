import express from 'express';
import TeamController from '../controllers/teamController.js';
import upload from '../middlewares/fileUpload.js';

const router = express.Router();

// Create a new team
router.post('/',upload.single('teamLogo'), TeamController.createTeam);

// Get all teams
router.get('/', TeamController.getAllTeams);

// Get team by ID
router.get('/:id', TeamController.getTeamById);

// Assign player to team
router.post('/:teamId/assign-player', TeamController.assignPlayerToTeam);

// Remove player from team
router.post('/:teamId/remove-player', TeamController.removePlayerFromTeam);

export default router;

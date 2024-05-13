import Team from '../models/teamModel.js';

const TeamController = {
  async createTeam(req, res) {
    try {
      const { name, leagueId, seasonId, players, logo, jerseyColor, standings } = req.body;

      const team = new Team({
        name,
        leagueId,
        seasonId,
        players,
        logo,
        jerseyColor,
        standings,
      });

      await team.save();

      res.status(201).json({ message: 'Team created successfully', team });
    } catch (error) {
      console.error('Error creating team:', error);
      res.status(500).json({ message: 'An error occurred while creating team' });
    }
  },

  async getAllTeams(req, res) {
    try {
      const teams = await Team.find();
      res.status(200).json({ teams });
    } catch (error) {
      console.error('Error fetching teams:', error);
      res.status(500).json({ message: 'An error occurred while fetching teams' });
    }
  },

  async getTeamById(req, res) {
    try {
      const teamId = req.params.id;
      const team = await Team.findById(teamId);

      if (!team) {
        return res.status(404).json({ message: 'Team not found' });
      }

      res.status(200).json({ team });
    } catch (error) {
      console.error('Error fetching team by ID:', error);
      res.status(500).json({ message: 'An error occurred while fetching team' });
    }
  },

// Logic for assigning a player to a team
async assignPlayerToTeam(req, res){
  try {
    const { teamId } = req.params;
    const { playerId } = req.body;

    // Retrieve the team from the database
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if the player is already in the team's players array
    if (team.players.includes(playerId)) {
      return res.status(400).json({ message: 'Player already assigned to the team' });
    }

    // Add the player to the team's players array
    team.players.push(playerId);

    // Save the updated team data
    const updatedTeam = await team.save();

    res.status(200).json({ message: 'Player assigned to team successfully', team: updatedTeam });
  } catch (error) {
    console.error('Error assigning player to team:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
},

// Logic for removing a player from a team
 async removePlayerFromTeam(req, res) {
  try {
    const { teamId } = req.params;
    const { playerId } = req.body;

    // Retrieve the team from the database
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Filter out the player's ID from the team's players array
    team.players = team.players.filter((id) => id !== playerId);

    // Save the updated team data
    const updatedTeam = await team.save();

    res.status(200).json({ message: 'Player removed from team successfully', team: updatedTeam });
  } catch (error) {
    console.error('Error removing player from team:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
};
export default TeamController;

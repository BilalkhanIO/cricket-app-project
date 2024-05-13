import League from '../models/leagueModel.js';

const LeagueController = {
  async createLeague(req, res) {
    try {
      const { name, description } = req.body;

      const league = new League({ name, description });
      await league.save();

      res.status(201).json({ message: 'League created successfully', league });
    } catch (error) {
      console.error('Error creating league:', error);
      res.status(500).json({ message: 'An error occurred while creating league' });
    }
  },

  async getAllLeagues(req, res) {
    try {
      const leagues = await League.find();
      res.status(200).json({ leagues });
    } catch (error) {
      console.error('Error fetching leagues:', error);
      res.status(500).json({ message: 'An error occurred while fetching leagues' });
    }
  },

  async getLeagueById(req, res) {
    try {
      const leagueId = req.params.id;
      const league = await League.findById(leagueId);

      if (!league) {
        return res.status(404).json({ message: 'League not found' });
      }

      res.status(200).json({ league });
    } catch (error) {
      console.error('Error fetching league by ID:', error);
      res.status(500).json({ message: 'An error occurred while fetching league' });
    }
  },
};

export default LeagueController;

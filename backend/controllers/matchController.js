import Match from '../models/matchModel.js';

const MatchController = {
  async createMatch(req, res) {
    try {
      const {
        seasonId,
        leagueId,
        team1,
        team2,
        venue,
        date,
        toss,
        decision,
        matchDuration,
        bowling,
        batting,
        scorecard,
        result,
        manOfTheMatch,
      } = req.body;

      const match = new Match({
        seasonId,
        leagueId,
        team1,
        team2,
        venue,
        date,
        toss,
        decision,
        matchDuration,
        bowling,
        batting,
        scorecard,
        result,
        manOfTheMatch,
      });

      await match.save();

      res.status(201).json({ message: 'Match created successfully', match });
    } catch (error) {
      console.error('Error creating match:', error);
      res.status(500).json({ message: 'An error occurred while creating match' });
    }
  },

  async getAllMatches(req, res) {
    try {
      const matches = await Match.find();
      res.status(200).json({ matches });
    } catch (error) {
      console.error('Error fetching matches:', error);
      res.status(500).json({ message: 'An error occurred while fetching matches' });
    }
  },

  async getMatchById(req, res) {
    try {
      const matchId = req.params.id;
      const match = await Match.findById(matchId);

      if (!match) {
        return res.status(404).json({ message: 'Match not found' });
      }

      res.status(200).json({ match });
    } catch (error) {
      console.error('Error fetching match by ID:', error);
      res.status(500).json({ message: 'An error occurred while fetching match' });
    }
  },
};

export default MatchController;

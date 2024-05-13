import Score from '../models/scoreModel.js';

const ScoreController = {
  async createScore(req, res) {
    try {
      const { innings } = req.body;

      const score = new Score({
        innings,
      });

      await score.save();

      res.status(201).json({ message: 'Score created successfully', score });
    } catch (error) {
      console.error('Error creating score:', error);
      res.status(500).json({ message: 'An error occurred while creating score' });
    }
  },

  async getAllScores(req, res) {
    try {
      const scores = await Score.find();
      res.status(200).json({ scores });
    } catch (error) {
      console.error('Error fetching scores:', error);
      res.status(500).json({ message: 'An error occurred while fetching scores' });
    }
  },

  async getScoreById(req, res) {
    try {
      const scoreId = req.params.id;
      const score = await Score.findById(scoreId);

      if (!score) {
        return res.status(404).json({ message: 'Score not found' });
      }

      res.status(200).json({ score });
    } catch (error) {
      console.error('Error fetching score by ID:', error);
      res.status(500).json({ message: 'An error occurred while fetching score' });
    }
  },
};

export default ScoreController;

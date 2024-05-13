import Season from '../models/seasonModel.js';

const SeasonController = {
  async createSeason(req, res) {
    try {
      const { name, startDate, endDate, league } = req.body;

      const season = new Season({ name, startDate, endDate, league });
      await season.save();

      res.status(201).json({ message: 'Season created successfully', season });
    } catch (error) {
      console.error('Error creating season:', error);
      res.status(500).json({ message: 'An error occurred while creating season' });
    }
  },

  async getAllSeasons(req, res) {
    try {
      const seasons = await Season.find();
      res.status(200).json({ seasons });
    } catch (error) {
      console.error('Error fetching seasons:', error);
      res.status(500).json({ message: 'An error occurred while fetching seasons' });
    }
  },

  async getSeasonById(req, res) {
    try {
      const seasonId = req.params.id;
      const season = await Season.findById(seasonId);

      if (!season) {
        return res.status(404).json({ message: 'Season not found' });
      }

      res.status(200).json({ season });
    } catch (error) {
      console.error('Error fetching season by ID:', error);
      res.status(500).json({ message: 'An error occurred while fetching season' });
    }
  },
};

export default SeasonController;

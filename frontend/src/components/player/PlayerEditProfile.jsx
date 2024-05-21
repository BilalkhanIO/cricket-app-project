import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchPlayer, updatePlayer } from '../slices/playerSlice';
import TeamSelect from '../components/TeamSelect';

const PlayerUpdate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { player, loading, error } = useSelector((state) => state.player);
  const [formData, setFormData] = React.useState({
    name: '',
    bio: '',
    playerType: '',
    teamId: '',
    profilePicture: null,
  });

  useEffect(() => {
    dispatch(fetchPlayer(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (player) {
      setFormData({
        name: player.name,
        bio: player.bio,
        playerType: player.playerType,
        teamId: player.team._id,
      });
    }
  }, [player]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, profilePicture: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('name', formData.name);
    data.append('bio', formData.bio);
    data.append('playerType', formData.playerType);
    data.append('teamId', formData.teamId);
    if (formData.profilePicture) {
      data.append('profilePicture', formData.profilePicture);
    }

    await dispatch(updatePlayer({ id: player._id, formData }));
    alert('Profile updated successfully');
    navigate('/players');
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Update Player Profile</h1>
      <form onSubmit={handleSubmit} className="max-w-md mx-auto" encType="multipart/form-data">
        <div className="mb-4">
          <label className="block text-gray-700">Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-300 rounded mt-1"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Bio:</label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-300 rounded mt-1"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Player Type:</label>
          <select
            name="playerType"
            value={formData.playerType}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-300 rounded mt-1"
          >
            <option value="">Select player type</option>
            <option value="batsman">Batsman</option>
            <option value="bowler">Bowler</option>
            <option value="all_rounder">All-Rounder</option>
            <option value="wicket_keeper">Wicket Keeper</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Team:</label>
          <TeamSelect value={formData.teamId} onChange={handleChange} />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Profile Picture:</label>
          <input
            type="file"
            onChange={handleFileChange}
            className="w-full p-2 border border-gray-300 rounded mt-1"
          />
        </div>
        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
          Update Profile
        </button>
      </form>
    </div>
  );
};

export default PlayerUpdate;

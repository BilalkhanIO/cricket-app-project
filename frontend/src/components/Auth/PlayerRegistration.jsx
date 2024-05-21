import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { registerPlayer } from "../../store/slices/playerSlice";
import { Link  , useNavigate} from "react-router-dom";

const PlayerRegister = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.player);

  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    playerType: "",
    teamId: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit =  async (e) => {
    e.preventDefault();
    const result = await dispatch(registerPlayer(formData));
    if (result.meta.requestStatus === 'fulfilled') {
      navigate('/login');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto bg-white shadow-lg rounded-lg p-8"
    >
      <p className="text-lg text-center mb-8 text-gray-600">
      Join a team, track your performance, and connect with fellow players
      </p>
      <div className="mb-4">
        <label className="block text-gray-700">Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 rounded border focus:outline-none focus:border-gray-500"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Player Type</label>
        <select
          name="playerType"
          value={formData.playerType}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 rounded border focus:outline-none focus:border-gray-500"
        >
          <option value="">Select player type</option>
          <option value="batsman">Batsman</option>
          <option value="bowler">Bowler</option>
          <option value="all_rounder">All-Rounder</option>
          <option value="wicket_keeper">Wicket Keeper</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 rounded border focus:outline-none focus:border-gray-500"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Password</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 rounded border focus:outline-none focus:border-gray-500"
        />
      </div>
      <p className="text-center mb-8 text-gray-600">Already have an account? <Link to="/login" className="text-gray-800">Sign in here</Link></p>
      <button
        type="submit"
        className="bg-gray-800 text-white  font-medium px-4 py-2 rounded w-full"
      >
        {loading ? "SIGNING..." : "SIGN UP"}
      </button>
      {error && <p className="text-red-500">{error.message}</p>}
    </form>
  );
};

export default PlayerRegister;

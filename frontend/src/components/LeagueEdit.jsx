// components/LeagueEdit.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const LeagueEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [leagueLogo, setLeagueLogo] = useState(null);

  useEffect(() => {
    const fetchLeagueDetails = async () => {
      try {
        const response = await axios.get(`/api/leagues/${id}`);
        setName(response.data.league.name);
        setDescription(response.data.league.description);
        setLeagueLogo(response.data.league.leagueLogo);
      } catch (error) {
        console.error('Error fetching league details:', error);
      }
    };

    fetchLeagueDetails();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('leagueLogo', leagueLogo);

    try {
      await axios.put(`/api/leagues/${id}`, formData);
      navigate('/leagues');
    } catch (error) {
      console.error('Error updating league:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 bg-white shadow-md rounded">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="League Name"
        className="w-full mb-4 p-2 border rounded"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        className="w-full mb-4 p-2 border rounded"
      ></textarea>
      <input
        type="file"
        onChange={(e) => setLeagueLogo(e.target.files[0])}
        className="w-full mb-4"
      />
      <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Update
      </button>
    </form>
  );
};

export default LeagueEdit;
// src/pages/MatchDetails.js

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const MatchDetails = () => {
  const { id } = useParams();
  const [match, setMatch] = useState(null);

  useEffect(() => {
    const fetchMatchDetails = async () => {
      try {
        const response = await axios.get(`/api/matches/${id}`);
        setMatch(response.data.match);
      } catch (error) {
        console.error('Error fetching match details:', error);
      }
    };

    fetchMatchDetails();
  }, [id]);

  if (!match) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">{match.name}</h1>
      <p>Date: {match.date}</p>
      <p>Teams: {match.team1.name} vs {match.team2.name}</p>
      <p>Venue: {match.venue}</p>
      <p>Details: {match.details}</p>
    </div>
  );
};

export default MatchDetails;
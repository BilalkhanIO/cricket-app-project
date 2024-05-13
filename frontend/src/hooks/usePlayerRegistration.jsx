import { useState, useEffect } from 'react';
import axios from 'axios';

const usePlayerRegistration = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const registerPlayer = async (name, email, password) => {
    try {
      setLoading(true);
      const response = await axios.post('/register', {
        name,
        email,
        password,
      });
      setLoading(false);
      return response.data;
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return { registerPlayer, error, loading };
};

export default usePlayerRegistration;
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/auth'; // Update the base URL with your backend URL

const authService = {
  register: async (email, password) => {
    try {
      const response = await axios.post(`${BASE_URL}/register`, { email, password });
      return response.data;
    } catch (error) {
      throw new Error(error.response.data.message || 'Failed to register user');
    }
  },
  
  login: async (email, password) => {
    try {
      const response = await axios.post(`${BASE_URL}/login`, { email, password });
      return response.data;
    } catch (error) {
      throw new Error(error.response.data.message || 'Failed to login');
    }
  }
};

export default authService;

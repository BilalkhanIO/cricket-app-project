// src/slices/leagueSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const createLeague = createAsyncThunk('leagues/createLeague', async (leagueData, thunkAPI) => {
  try {
    const response = await axios.post('http://localhost:3000/api/leagues/create', leagueData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response.data);
  }
});

export const fetchLeagueById = createAsyncThunk('league/fetchLeagueById', async (id, thunkAPI) => {
  try {
    const response = await axios.get(`http://localhost:3000/api/leagues/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data.league;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response.data);
  }
});

export const fetchLeagues = createAsyncThunk('leagues/fetchLeagues', async (_, thunkAPI) => {
  try {
    const response = await axios.get('http://localhost:3000/api/leagues', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data.leagues;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response.data);
  }
});

export const updateLeague = createAsyncThunk('leagues/updateLeague', async ({ id, leagueData }, thunkAPI) => {
  try {
    const response = await axios.put(`http://localhost:3000/api/leagues/${id}`, leagueData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.league;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response.data);
  }
});

export const deleteLeague = createAsyncThunk('leagues/deleteLeague', async (id, thunkAPI) => {
  try {
    const response = await axios.delete(`/api/leagues/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response.data);
  }
});

const leagueSlice = createSlice({
  name: 'leagues',
  initialState: {
    leagues: [],
    currentLeague: null,
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeagues.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeagues.fulfilled, (state, action) => {
        state.loading = false;
        state.leagues = action.payload;
      })
      .addCase(fetchLeagues.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createLeague.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createLeague.fulfilled, (state, action) => {
        state.loading = false;
        state.leagues.push(action.payload.league);
      })
      .addCase(createLeague.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateLeague.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateLeague.fulfilled, (state, action) => {
        state.loading = false;
        state.leagues = state.leagues.map(league =>
          league._id === action.payload._id ? action.payload : league
        );
      })
      .addCase(updateLeague.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteLeague.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteLeague.fulfilled, (state, action) => {
        state.loading = false;
        state.leagues = state.leagues.filter(league => league._id !== action.meta.arg);
      })
      .addCase(deleteLeague.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchLeagueById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchLeagueById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentLeague = action.payload;
        state.error = null;
      })
      .addCase(fetchLeagueById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.currentLeague = null;
      });
  },
});

export default leagueSlice.reducer;

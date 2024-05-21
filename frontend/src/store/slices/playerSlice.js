import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Thunks
export const registerPlayer = createAsyncThunk('player/registerPlayer', async (playerData, thunkAPI) => {
  try {
    const response = await axios.post('http://localhost:3000/api/players/register', playerData);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response.data);
  }
});

export const fetchPlayer = createAsyncThunk('player/fetchPlayer', async (id, thunkAPI) => {
  try {
    const response = await axios.get(`http://localhost:3000/api/players/${id}`);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response.data);
  }
});

export const updatePlayer = createAsyncThunk('player/updatePlayer', async ({ id, formData }, thunkAPI) => {
  try {
    const response = await axios.put(`http://localhost:3000/api/players/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response.data);
  }
});

export const deletePlayer = createAsyncThunk('player/deletePlayer', async (id, thunkAPI) => {
  try {
    const response = await axios.delete(`http://localhost:3000/api/players/${id}`);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response.data);
  }
});

export const fetchPlayers = createAsyncThunk('player/fetchPlayers', async (_, thunkAPI) => {
  try {
    const response = await axios.get('http://localhost:3000/api/players/players');
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response.data);
  }
});

// Slice
const playerSlice = createSlice({
  name: 'player',
  initialState: {
    player: null,
    players: [],
    loading: false,
    error: null,
  },
  reducers: { },
  extraReducers: (builder) => {
    builder
    .addCase(registerPlayer.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(registerPlayer.fulfilled, (state, action) => {
      state.loading = false;
      state.players.push(action.payload);
    })
    .addCase(registerPlayer.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })
      .addCase(fetchPlayer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPlayer.fulfilled, (state, action) => {
        state.loading = false;
        state.player = action.payload.player;
      })
      .addCase(fetchPlayer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updatePlayer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePlayer.fulfilled, (state, action) => {
        state.loading = false;
        state.player = action.payload.player;
      })
      .addCase(updatePlayer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deletePlayer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePlayer.fulfilled, (state) => {
        state.loading = false;
        state.player = null;
      })
      .addCase(deletePlayer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchPlayers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPlayers.fulfilled, (state, action) => {
        state.loading = false;
        state.players = action.payload.players;
      })
      .addCase(fetchPlayers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearPlayer } = playerSlice.actions;

export default playerSlice.reducer;

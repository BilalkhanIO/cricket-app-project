import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Thunks
export const loginUser = createAsyncThunk('user/loginUser', async (credentials, thunkAPI) => {
  try {
    const response = await axios.post('http://localhost:3000/api/user/login', credentials);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response.data);
  }
});

export const registerUser = createAsyncThunk('user/registerUser', async (userData, thunkAPI) => {
  try {
    const response = await axios.post('http://localhost:3000/api/user/register', userData);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response.data);
  }
});

export const fetchUserProfile = createAsyncThunk('user/fetchUserProfile', async (_, thunkAPI) => {
  try {
    const response = await axios.get('http://localhost:3000/api/user/profile', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response.data);
  }
});

export const updateUserProfile = createAsyncThunk('user/updateUserProfile', async (formData, thunkAPI) => {
  try {
    const response = await axios.put('http://localhost:3000/api/user/profile', formData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response.data);
  }
});

export const deleteUserAccount = createAsyncThunk('user/deleteUserAccount', async(_, thunkAPI)=>{
  try { const response = await axios.delete('http://localhost:3000/api/user/delete',{
    headers:{
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });
  return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response.data);
  }
})

// Slice
const userSlice = createSlice({
  name: 'user',
  initialState: {
    user: null,
    loading: false,
    error: null,
  },
  reducers: {
    logoutUser: (state) => {
      state.user = null;
      localStorage.removeItem('token');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        localStorage.setItem('token', action.payload.token);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        localStorage.setItem('token', action.payload.token);
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteUserAccount.pending, (state)=>{
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUserAccount.fulfilled, (state)=>{
        state.loading = false;
        state.user = null;
        localStorage.removeItem('token');
      })
      .addCase(deleteUserAccount.rejected, (state)=>{
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logoutUser } = userSlice.actions;

export default userSlice.reducer;

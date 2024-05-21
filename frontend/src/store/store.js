import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import playerReducer from './slices/playerSlice';
import leagueReducer from './slices/LeagueSlice';

const store = configureStore({
  reducer: {
    user: userReducer,
    player: playerReducer,
    league: leagueReducer,
  },
});

export default store;

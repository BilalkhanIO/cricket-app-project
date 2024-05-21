import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from '../pages/Home';
import Signup from '../pages/Signup';
import UserProfile from '../pages/UserProfile';
import EditProfile  from '../components/user/UserEditProfile';
import Login from '../pages/Login';
import Players from '../pages/Players'; 
import PlayerProfile from '../components/player/PlayerProfile';
import League from '../pages/League';
import LeagueCreate from '../components/league/LeagueCreate';
import LeagueDetails from '../components/league/LeagueDetails';
import LeagueUpdate from '../components/league/LeagueUpdate';


function AppRouter() {
  return (
    <Routes>
        <Route exact path='/' element={<Home/>}/>
        <Route path='/sign-up' element={<Signup/>}/>
        <Route path='/login' element={<Login/>}/>
        <Route path='/players'element={<Players/>}/>
        <Route path='/players/:id/profile'element={<PlayerProfile/>}/>
        <Route path='/leagues'element={<League/>}/>
        <Route path='/leagues/create'element={<LeagueCreate/>}/>
        <Route path='/leagues/:id' element={<LeagueDetails />} />
        <Route path='/leagues/update/:id' element={<LeagueUpdate />} />
          {/*<Route path='/teams'element={<Teams/>}/>
  <Route path='/matches'element={<Matches/>}/> */}
        <Route path='/profile'element={<UserProfile/>}/>  
        <Route path='/edit-profile'element={<EditProfile/>}/>      
    </Routes>
  )
}

export default AppRouter
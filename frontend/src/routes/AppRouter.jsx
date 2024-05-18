import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from '../pages/Home';
import UserRegistration from '../components/Auth/UserRegistration';
import UserProfile from '../pages/UserProfile';
import EditProfile  from '../components/Profile/UserEditProfile';
import Login from '../pages/Login';
import Players from '../pages/Players'; 
import PlayerProfile from '../components/PlayerProfile';


function AppRouter() {
  return (
    <Routes>
        <Route exact path='/' element={<Home/>}/>
        <Route path='/sign-up' element={<UserRegistration/>}/>
        <Route path='/login' element={<Login/>}/>
        <Route path='/players'element={<Players/>}/>
        <Route path='/player/:id/propfile'element={<PlayerProfile/>}/>
          {/*<Route path='/teams'element={<Teams/>}/>
        <Route path='/leagues'element={<Leagues/>}/>
  <Route path='/matches'element={<Matches/>}/> */}
        <Route path='/profile'element={<UserProfile/>}/>  
        <Route path='/edit-profile'element={<EditProfile/>}/>      
    </Routes>
  )
}

export default AppRouter
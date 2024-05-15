import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from '../components/Home';
import UserRegistration from '../components/UserRegistration';
import Login from '../components/Login';


function AppRouter() {
  return (
    <Routes>
        <Route exact path='/' element={<Home/>}/>
        <Route path='/sign-up' element={<UserRegistration/>}/>
        <Route path='/sign-in' element={<Login/>}/>
        {/* <Route path='/players'element={<Players/>}/>
        <Route path='/teams'element={<Teams/>}/>
        <Route path='/leagues'element={<Leagues/>}/>
        <Route path='/matches'element={<Matches/>}/>
        <Route path='/user-profile'element={<UserProfile/>}/>         */}
    </Routes>
  )
}

export default AppRouter
import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from '../components/Home';
import Auth from '../components/Auth';

function AppRouter() {
  return (
    <Routes>
        <Route exact path='/' element={<Home/>}/>
        <Route path="/auth" element={<Auth/>} />
        
    </Routes>
  )
}

export default AppRouter
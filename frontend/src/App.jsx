
import React from 'react';
import AppRouter from './routes/AppRouter';
import Header from './components/Header';
import Footer from './components/Footer';

const App = () => {
  return <>
  <Header/>
  <AppRouter />
  <Footer/>
  </>
};

export default App;

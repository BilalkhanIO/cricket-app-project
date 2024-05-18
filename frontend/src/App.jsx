
import React from 'react';
import AppRouter from './routes/AppRouter';
import Header from './components/common/Header';
import Footer from './components/common/Footer';

const App = () => {
  return <>
  <Header/>
  <AppRouter />
  <Footer/>
  </>
};

export default App;

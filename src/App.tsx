import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainPage from './pages/MainPage';
import AdminPage from './pages/AdminPage';
import useGaPageView from './hooks/useGaPageView';

function App() {
  useGaPageView();

  return (
    <Routes>
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/*" element={<MainPage />} />
    </Routes>
  );
}

export default App;

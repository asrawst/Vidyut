import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import InspectorPage from './pages/InspectorPage';
import { startKeepAlive, stopKeepAlive } from './utils/backendWarmer';
import './App.css';

function App() {
  // Clean up any stale theme tokens and pre-warm backend on Render
  useEffect(() => {
    localStorage.removeItem('vidyut_theme');
    document.documentElement.removeAttribute('data-theme');
    startKeepAlive();

    return () => {
      stopKeepAlive();
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<HomePage />} />
        
        {/* Admin Dashboard & Sub-Feature Routes */}
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/:tab" element={<AdminPage />} />

        {/* Field Inspector Portal & Sub-Feature Routes */}
        <Route path="/inspector" element={<InspectorPage />} />
        <Route path="/inspector/:tab" element={<InspectorPage />} />
        
        {/* Aliases for Inspector Portal */}
        <Route path="/inspector-portal" element={<Navigate to="/inspector" replace />} />
        <Route path="/inspector-portal/:tab" element={<InspectorPage />} />
        <Route path="/portal" element={<Navigate to="/inspector" replace />} />

        {/* Password Reset Route */}
        <Route path="/reset-password" element={<HomePage />} />

        {/* Catch-all Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

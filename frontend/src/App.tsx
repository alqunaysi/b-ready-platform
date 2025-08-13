import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AssessmentPage from './pages/AssessmentPage';
import ResultsPage from './pages/ResultsPage';

/**
 * Root application component with route definitions.
 */
const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/assessments/:id" element={<AssessmentPage />} />
      <Route path="/results/:id" element={<ResultsPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default App;
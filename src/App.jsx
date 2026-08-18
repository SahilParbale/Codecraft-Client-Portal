import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ProductSelect from './pages/ProductSelect';
import ClientTracker from './pages/ClientTracker';
import ClientJourney from './pages/ClientJourney';
import { getAuth } from './store/DataStore';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = getAuth();
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Route that redirects to products if already logged in
const PublicRoute = ({ children }) => {
  const isAuthenticated = getAuth();
  if (isAuthenticated) {
    return <Navigate to="/products" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
        <Route 
          path="/products" 
          element={
            <ProtectedRoute>
              <ProductSelect />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/tracker/:productId" 
          element={
            <ProtectedRoute>
              <ClientTracker />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/tracker/:productId/client/:clientId" 
          element={
            <ProtectedRoute>
              <ClientJourney />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

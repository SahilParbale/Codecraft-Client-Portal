import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import ProductSelect from './pages/ProductSelect';
import ClientTracker from './pages/ClientTracker';
import ClientJourney from './pages/ClientJourney';
import { getAuth } from './store/DataStore';

const LAST_PATH_KEY = 'codecraft_last_visited_path';

// Navigation Tracker: remembers the active route so refresh or reopen returns to the exact same page
const RouteTracker = () => {
  const location = useLocation();
  useEffect(() => {
    if (location.pathname && location.pathname !== '/') {
      localStorage.setItem(LAST_PATH_KEY, location.pathname + location.search);
    }
  }, [location]);
  return null;
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = getAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  return children;
};

// Route that redirects to products/last visited page if already logged in
const PublicRoute = ({ children }) => {
  const isAuthenticated = getAuth();
  if (isAuthenticated) {
    const savedPath = localStorage.getItem(LAST_PATH_KEY);
    const destination = (savedPath && savedPath !== '/' && !savedPath.includes('login')) 
      ? savedPath 
      : '/products';
    return <Navigate to={destination} replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <RouteTracker />
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

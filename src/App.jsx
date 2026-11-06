import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import ProductSelect from './pages/ProductSelect';
import ClientTracker from './pages/ClientTracker';
import ClientJourney from './pages/ClientJourney';
import ClientTableView from './pages/ClientTableView';
import { getAuth } from './store/DataStore';

const LAST_PATH_KEY = 'codecraft_last_visited_path';

// Navigation Tracker: remembers active workspace route so refresh returns to exact page
const RouteTracker = () => {
  const location = useLocation();
  useEffect(() => {
    // Only track authenticated workspace paths (never '/' or '/login')
    if (
      location.pathname && 
      location.pathname !== '/' && 
      location.pathname !== '/login'
    ) {
      localStorage.setItem(LAST_PATH_KEY, location.pathname + location.search);
    }
  }, [location]);
  return null;
};

// Protected Route Component: enforces login for workspace pages
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = getAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <RouteTracker />
      <Routes>
        {/* Default route ALWAYS opens the Login page */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Workspace Routes */}
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
        {/* Dedicated Full Table View Pages */}
        <Route 
          path="/tracker/:productId/view-all" 
          element={
            <ProtectedRoute>
              <ClientTableView />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/tracker/:productId/view-all/:category" 
          element={
            <ProtectedRoute>
              <ClientTableView />
            </ProtectedRoute>
          } 
        />
        {/* Individual Client Journey */}
        <Route 
          path="/tracker/:productId/client/:clientId" 
          element={
            <ProtectedRoute>
              <ClientJourney />
            </ProtectedRoute>
          } 
        />

        {/* Catch-all redirect to login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

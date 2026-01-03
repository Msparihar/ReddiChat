import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth-store';
import LandingPage from './landing/LandingPage';
import AppLayout from './layout/AppLayout';
import ChatArea from './chat/ChatArea';
import Login from './auth/Login';
import SignInPage from './auth/SignInPage';
import RedditUserPage from './RedditUserPage';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        {/* Landing page - accessible to all users */}
        <Route path="/" element={<LandingPage />} />

        {/* Login page */}
        <Route path="/login" element={<SignInPage />} />

        {/* Alternative sign-in page */}
        <Route path="/signin" element={<SignInPage />} />

        {/* Reddit user history lookup - public */}
        <Route path="/u/:username?" element={<RedditUserPage />} />

        {/* Protected chat route */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ChatArea />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Redirect any unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;

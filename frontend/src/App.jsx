import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import VerifyCodePage from './pages/VerifyCodePage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { TEACHING_ROLES } from './constants';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import './styles/global.css';

function App() {
  // Socket connection is now handled by SocketProvider
  return (
    <Router>
      <SocketProvider>
        <NotificationProvider>
          <div className="app-container">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/verify-code" element={<VerifyCodePage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student"
                element={
                  <ProtectedRoute allowedRoles={['Student']}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher"
                element={
                  <ProtectedRoute allowedRoles={TEACHING_ROLES}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<HomePage />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </NotificationProvider>
      </SocketProvider>
    </Router>
  )
}
export default App;

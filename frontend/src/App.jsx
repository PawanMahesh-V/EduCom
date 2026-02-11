import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { TEACHING_ROLES } from './constants';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider } from './context/AuthContext';
import './styles/global.css';

// Lazy load pages
const HomePage = React.lazy(() => import('./pages/HomePage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = React.lazy(() => import('./pages/ForgotPasswordPage'));
const VerifyCodePage = React.lazy(() => import('./pages/VerifyCodePage'));
const ResetPasswordPage = React.lazy(() => import('./pages/ResetPasswordPage'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // good default for dashboard data
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Loading component
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--color-primary)' }}>
    <div className="spinner-border" role="status">
      <span className="sr-only">Loading...</span>
    </div>
  </div>
);

function App() {  
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <ErrorBoundary>
          <AuthProvider>
            <SocketProvider>
              <NotificationProvider>
                <div className="app-container">
                  <Suspense fallback={<PageLoader />}>
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
                  </Suspense>
                </div>
              </NotificationProvider>
            </SocketProvider>
          </AuthProvider>
        </ErrorBoundary>
      </Router>
    </QueryClientProvider>
  )
}
export default App;

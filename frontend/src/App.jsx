import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ClaimsList from './pages/ClaimsList';
import ClaimDetail from './pages/ClaimDetail';
import ClaimForm from './pages/ClaimForm';
import Reports from './pages/Reports';
import AuditLogs from './pages/AuditLogs';
import StaffManagement from './pages/StaffManagement';
import WebsiteSettings from './pages/WebsiteSettings';
import ProfileSettings from './pages/ProfileSettings';
import Sidebar from './components/Sidebar';
import ThemeToggle from './components/ThemeToggle';
import { API_BASE_URL } from './config';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const handleLoginSuccess = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
  };

  // On initial mount, verify user session (optional check but good)
  useEffect(() => {
    if (token) {
      // Test if token expired or is still valid
       fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then((res) => {
        if (!res.ok) {
          handleLogout();
        }
      })
      .catch((err) => {
        console.error('Session verification error:', err);
      });
    }
  }, [token]);

  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-app)' }}>
        {token && <Sidebar user={user} onLogout={handleLogout} />}
        
        <main style={{
          flex: 1,
          marginLeft: token ? '260px' : '0px',
          minWidth: 0,
          position: 'relative',
          transition: 'margin-left var(--transition-normal)'
        }}>
          {/* Theme Toggle (Header Floating) */}
          {token && (
            <div style={{
              position: 'absolute',
              top: '24px',
              right: '30px',
              zIndex: 90,
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <ThemeToggle />
            </div>
          )}

          <Routes>
            {/* Public Route */}
            <Route 
              path="/login" 
              element={!token ? <Login onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/dashboard" />} 
            />

            {/* Protected Routes */}
            <Route 
              path="/dashboard" 
              element={token ? <Dashboard token={token} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/claims" 
              element={token ? <ClaimsList token={token} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/claims/new" 
              element={token ? <ClaimForm token={token} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/claims/:id" 
              element={token ? <ClaimDetail token={token} user={user} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/reports" 
              element={
                token && (user.role === 'manager' || user.role === 'admin') 
                  ? <Reports token={token} /> 
                  : <Navigate to="/dashboard" />
              } 
            />
            <Route 
              path="/audit-logs" 
              element={
                token && (user.role === 'manager' || user.role === 'admin') 
                  ? <AuditLogs token={token} /> 
                  : <Navigate to="/dashboard" />
              } 
            />

            <Route 
              path="/staff" 
              element={
                token && user.role === 'admin' 
                  ? <StaffManagement token={token} currentUser={user} /> 
                  : <Navigate to="/dashboard" />
              } 
            />

            <Route 
              path="/settings" 
              element={
                token && user.role === 'admin' 
                  ? <WebsiteSettings token={token} /> 
                  : <Navigate to="/dashboard" />
              } 
            />

            <Route 
              path="/profile" 
              element={
                token 
                  ? <ProfileSettings token={token} currentUser={user} onAuthChange={handleLoginSuccess} /> 
                  : <Navigate to="/login" />
              } 
            />

            {/* Default redirects */}
            <Route 
              path="*" 
              element={<Navigate to={token ? "/dashboard" : "/login"} />} 
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

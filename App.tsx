
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import PublicView from './pages/PublicView';
import CreateAssociation from './pages/CreateAssociation';
import { AuthState } from './types';

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>(() => {
    const saved = localStorage.getItem('ae_auth_session');
    return saved ? JSON.parse(saved) : { isLoggedIn: false, associationId: null, associationName: null, adminId: null, adminName: null };
  });

  const login = (id: string, name: string, adminId: string, adminName: string) => {
    const newAuth = { isLoggedIn: true, associationId: id, associationName: name, adminId, adminName };
    setAuth(newAuth);
    localStorage.setItem('ae_auth_session', JSON.stringify(newAuth));
  };

  const logout = () => {
    const newAuth = { isLoggedIn: false, associationId: null, associationName: null, adminId: null, adminName: null };
    setAuth(newAuth);
    localStorage.removeItem('ae_auth_session');
  };

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateAssociation />} />
        <Route path="/login" element={<AdminLogin onLogin={login} />} />
        <Route path="/view/:associationName" element={<PublicView />} />
        <Route 
          path="/admin" 
          element={
            auth.isLoggedIn ? (
              <AdminDashboard auth={auth} onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;

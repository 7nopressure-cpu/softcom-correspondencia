import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Bandejas } from './pages/Bandejas';
import { CreateCorrespondence } from './pages/CreateCorrespondence';
import { DetailCorrespondence } from './pages/DetailCorrespondence';
import { UserManagement } from './pages/UserManagement';
import { Layout } from './components/Layout';

// Componente para proteger las rutas
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Layout>{children}</Layout>;
};

export const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Rutas Protegidas dentro de Layout */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/bandejas" 
          element={
            <ProtectedRoute>
              <Bandejas />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/registrar" 
          element={
            <ProtectedRoute>
              <CreateCorrespondence />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/correspondencia/:id" 
          element={
            <ProtectedRoute>
              <DetailCorrespondence />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/usuarios" 
          element={
            <ProtectedRoute>
              <UserManagement />
            </ProtectedRoute>
          } 
        />

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;

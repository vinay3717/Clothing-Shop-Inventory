import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

import LoginPage    from './pages/LoginPage';
import Dashboard    from './pages/Dashboard';
import ItemsPage    from './pages/ItemsPage';
import CustomersPage from './pages/CustomersPage';
import BillsPage    from './pages/BillsPage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          }/>
          <Route path="/items" element={
            <ProtectedRoute><ItemsPage /></ProtectedRoute>
          }/>
          <Route path="/customers" element={
            <ProtectedRoute><CustomersPage /></ProtectedRoute>
          }/>
          <Route path="/bills" element={
            <ProtectedRoute><BillsPage /></ProtectedRoute>
          }/>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
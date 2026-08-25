import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tickets from './pages/Tickets';
import CreateTicket from './pages/CreateTicket';
import TicketDetails from './pages/TicketDetails';
import Categories from './pages/Categories';
import Users from './pages/Users';

const Layout = ({ children }) => (
  <>
    <Navbar />
    <main className="app-content">{children}</main>
  </>
);

const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading">Loading...</div>;
  return <Navigate to={user ? '/dashboard' : '/login'} replace />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/dashboard" element={
            <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>
          } />
          <Route path="/tickets" element={
            <ProtectedRoute><Layout><Tickets /></Layout></ProtectedRoute>
          } />
          <Route path="/tickets/new" element={
            <ProtectedRoute><Layout><CreateTicket /></Layout></ProtectedRoute>
          } />
          <Route path="/tickets/:id" element={
            <ProtectedRoute><Layout><TicketDetails /></Layout></ProtectedRoute>
          } />
          <Route path="/categories" element={
            <ProtectedRoute roles={['admin']}><Layout><Categories /></Layout></ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute roles={['admin']}><Layout><Users /></Layout></ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

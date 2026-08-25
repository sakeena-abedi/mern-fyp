import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Ticket, Plus, Settings, Users, LogOut } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;


  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <Link to="/dashboard" className="brand-link">
          <Ticket size={24} />
          HelpDesk<span>Pro</span>
        </Link>
      </div>
      <nav className="navbar-links">
        <Link to="/dashboard"><LayoutDashboard size={18} /> Dashboard</Link>
        <Link to="/tickets"><Ticket size={18} /> Tickets</Link>
        <Link to="/tickets/new"><Plus size={18} /> New</Link>
        {user.role === 'admin' && <Link to="/categories"><Settings size={18} /> Categories</Link>}
        {user.role === 'admin' && <Link to="/users"><Users size={18} /> Users</Link>}
      </nav>
      <div className="navbar-user">
        <span className="badge-role">{user.role}</span>
        <span>{user.name}</span>
        <button onClick={handleLogout} className="btn-link navbar-logout" title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};

export default Navbar;

// ============================================================
// Sidebar Component
// ============================================================

import { NavLink, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import './Sidebar.css';

const navItems = [
  { path: '/', icon: '⚡', label: 'Live Feed', roles: ['manager', 'staff', 'admin'] },
  { path: '/map', icon: '🗺️', label: 'Floor Map', roles: ['manager', 'admin'] },
  { path: '/incidents', icon: '🚨', label: 'Incidents', roles: ['manager', 'staff', 'admin'] },
  { path: '/staff', icon: '👥', label: 'Staff', roles: ['manager', 'admin'] },
  { path: '/reports', icon: '📊', label: 'Reports', roles: ['manager', 'admin'] },
];

const roleColors = {
  manager: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
  staff: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
  admin: 'linear-gradient(135deg, #06b6d4, #0891b2)',
  guest: 'linear-gradient(135deg, #64748b, #475569)',
};

export default function Sidebar({ liveCount }) {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const allowedNav = navItems.filter((n) => n.roles.includes(user?.role));

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🚨</div>
        <div>
          <span className="sidebar-logo-name">CrisisSync</span>
          <span className="sidebar-logo-hotel">Grand Palace Hotel</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {allowedNav.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span className="sidebar-link-icon">{item.icon}</span>
            <span className="sidebar-link-label">{item.label}</span>
            {item.path === '/' && liveCount > 0 && (
              <span className="sidebar-badge">{liveCount}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar" style={{ background: roleColors[user?.role] }}>
            {user?.name?.[0] || '?'}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.name}</span>
            <span className="sidebar-user-role">{user?.role}</span>
          </div>
        </div>
        <button className="sidebar-logout" onClick={logout} title="Logout">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </aside>
  );
}

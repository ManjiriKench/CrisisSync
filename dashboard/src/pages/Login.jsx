// ============================================================
// Login Page — Role-based login with stunning UI
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import './Login.css';

const roles = [
  {
    id: 'manager',
    title: 'Manager',
    desc: 'Full dashboard access. Assign staff, view map, broadcast.',
    icon: '🎯',
    gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
  },
  {
    id: 'staff',
    title: 'Staff',
    desc: 'View assignments, update status, share location.',
    icon: '👤',
    gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
  },
  {
    id: 'admin',
    title: 'Admin',
    desc: 'System configuration, user management, settings.',
    icon: '⚙️',
    gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',
  },
];

export default function Login() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const login = useAuthStore((s) => s.login);
  const error = useAuthStore((s) => s.error);
  const navigate = useNavigate();

  const handleLogin = async (role) => {
    setSelectedRole(role);
    setIsLoggingIn(true);
    try {
      await login(role);
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container animate-in">
        <div className="login-logo">
          <div className="logo-icon">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="22" stroke="url(#grad)" strokeWidth="3" fill="none" />
              <path d="M24 12L28 20H20L24 12Z" fill="#ef4444" />
              <circle cx="24" cy="28" r="3" fill="#3b82f6" />
              <path d="M16 34Q24 38 32 34" stroke="#22c55e" strokeWidth="2" fill="none" strokeLinecap="round" />
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="48" y2="48">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1>CrisisSync</h1>
          <p>Emergency Response Coordination Platform</p>
        </div>

        <div className="login-roles">
          {roles.map((role) => (
            <button
              key={role.id}
              className={`role-card ${selectedRole === role.id ? 'selected' : ''}`}
              onClick={() => handleLogin(role.id)}
              disabled={isLoggingIn}
            >
              <div className="role-icon" style={{ background: role.gradient }}>
                {role.icon}
              </div>
              <div className="role-info">
                <h3>{role.title}</h3>
                <p>{role.desc}</p>
              </div>
              {isLoggingIn && selectedRole === role.id && (
                <div className="spinner" style={{ marginLeft: 'auto' }} />
              )}
            </button>
          ))}
        </div>

        {error && <div className="login-error">❌ {error}</div>}

        <div className="login-footer">
          <p>Demo Mode — No credentials required</p>
          <p className="login-version">CrisisSync v1.0 · Mock Environment</p>
        </div>
      </div>
    </div>
  );
}

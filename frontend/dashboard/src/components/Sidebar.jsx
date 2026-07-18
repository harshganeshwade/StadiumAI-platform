import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  UserCog,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Zap,
  X,
  Edit2,
  Check,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Overview', icon: LayoutDashboard, id: 'nav-overview' },
  { path: '/crowd', label: 'Crowd Map', icon: Users, id: 'nav-crowd' },
  { path: '/incidents', label: 'Incidents', icon: AlertTriangle, id: 'nav-incidents' },
  { path: '/staff', label: 'Staff', icon: UserCog, id: 'nav-staff' },
  { path: '/analytics', label: 'Analytics', icon: BarChart3, id: 'nav-analytics' },
  { path: '/demo', label: 'AI Ops Simulator', icon: Sparkles, id: 'nav-demo' },
];

export default function Sidebar({ collapsed, onToggle, connected, alertsCount }) {
  const [showProfile, setShowProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Ops Manager State
  const [name, setName] = useState('Ops Manager');
  const [email, setEmail] = useState('manager@stadium.ai');
  const [customStatus, setCustomStatus] = useState(''); // 'busy' | 'away' | ''
  const [editName, setEditName] = useState(name);
  const [editEmail, setEditEmail] = useState(email);

  const getStatusClass = () => {
    if (customStatus === 'busy') return 'dnd';
    if (customStatus === 'away') return 'away';
    return connected ? 'online' : 'offline';
  };

  const getStatusLabel = () => {
    if (customStatus === 'busy') return 'Do Not Disturb';
    if (customStatus === 'away') return 'Away';
    return connected ? 'Connected' : 'Disconnected';
  };

  const handleSaveProfile = () => {
    setName(editName);
    setEmail(editEmail);
    setIsEditing(false);
  };

  const handleOpenProfile = () => {
    setEditName(name);
    setEditEmail(email);
    setIsEditing(false);
    setShowProfile(true);
  };

  return (
    <>
      <aside className={`sidebar${collapsed ? ' collapsed' : ''}`} id="sidebar">
        {/* Brand */}
        <div className="sidebar-brand" id="sidebar-brand">
          <div className="brand-icon">
            <Zap />
          </div>
          <div className="brand-text">
            <span className="brand-name">StadiumAI</span>
            <span className="brand-subtitle">Ops Dashboard</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav" id="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                id={item.id}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <Icon />
                <span className="nav-label">{item.label}</span>
                {item.path === '/incidents' && alertsCount > 0 && (
                  <span className="nav-badge" id="nav-incidents-badge">
                    {alertsCount > 99 ? '99+' : alertsCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer" id="sidebar-footer">
          <button className="sidebar-toggle" onClick={onToggle} id="sidebar-toggle-btn">
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <div
            className="sidebar-user"
            id="sidebar-user"
            onClick={handleOpenProfile}
            style={{ cursor: 'pointer' }}
          >
            <div className="user-avatar">
              {name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()}
              <span className={`status-dot ${getStatusClass()}`} id="connection-status-dot" />
            </div>
            <div className="user-info-text">
              <div className="user-name">{name}</div>
              <div className="user-role">{getStatusLabel()}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Profile Details Modal */}
      {showProfile && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(10, 11, 22, 0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000
        }}>
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius)', padding: '24px', width: '90%', maxWidth: '400px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)', boxSizing: 'border-box', color: 'var(--text-primary)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Ops Manager Profile</h3>
              <button
                onClick={() => setShowProfile(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{
                      width: '100%', padding: '10px', background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-primary)', color: 'var(--text-primary)',
                      borderRadius: 'var(--radius-sm)', boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    style={{
                      width: '100%', padding: '10px', background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-primary)', color: 'var(--text-primary)',
                      borderRadius: 'var(--radius-sm)', boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button
                    onClick={() => setIsEditing(false)}
                    style={{
                      padding: '6px 12px', background: 'transparent', color: 'var(--text-secondary)',
                      border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    style={{
                      padding: '6px 12px', background: 'var(--gradient-blue)', color: '#fff',
                      border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{
                    width: '60px', height: '60px', borderRadius: '50%', background: 'var(--gradient-blue)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 600, color: '#fff',
                    position: 'relative'
                  }}>
                    {name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()}
                    <span className={`status-dot ${getStatusClass()}`} style={{ position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, border: '2px solid var(--bg-secondary)' }} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '16px' }}>{name}</h4>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{email}</span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: '14px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Active Shift Settings</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span>Role:</span>
                    <strong style={{ color: 'var(--text-secondary)' }}>Operations Lead</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span>Location:</span>
                    <strong style={{ color: 'var(--text-secondary)' }}>Control Room North</strong>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: '14px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Update Status</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[
                      { label: 'Available', value: '', color: 'var(--accent-green)' },
                      { label: 'Busy', value: 'busy', color: 'var(--accent-red)' },
                      { label: 'Away', value: 'away', color: 'var(--accent-amber)' }
                    ].map(st => (
                      <button
                        key={st.label}
                        onClick={() => setCustomStatus(st.value)}
                        style={{
                          flex: 1, padding: '6px 8px', fontSize: '11px', background: 'var(--bg-tertiary)',
                          border: customStatus === st.value ? `1px solid ${st.color}` : '1px solid var(--border-primary)',
                          borderRadius: '20px', color: 'var(--text-primary)', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                        }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.color }} />
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button
                    onClick={() => setIsEditing(true)}
                    style={{
                      flex: 1, padding: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)',
                      borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px', fontWeight: 600
                    }}
                  >
                    <Edit2 size={14} /> Edit Profile
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

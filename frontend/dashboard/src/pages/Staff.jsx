/**
 * Staff Resource Page (Staff.jsx)
 * Displays staff list, shifts, and zone deployment details.
 */
import React, { useState } from 'react';
import { UserCheck, ShieldAlert, Award, Coffee, UserPlus, MapPin } from 'lucide-react';

const mockStaff = [
  { id: 'staff-1', name: 'Sarah Ops', role: 'Operations Manager', status: 'available', zone: 'North Concourse', subRole: 'operations_manager' },
  { id: 'staff-2', name: 'Mike Security', role: 'Security Lead', status: 'deployed', zone: 'Gate A', subRole: 'security_lead' },
  { id: 'staff-3', name: 'Dr. Chen', role: 'Medical Specialist', status: 'available', zone: 'Medical Station 1', subRole: 'medical_staff' },
  { id: 'staff-4', name: 'John Doe', role: 'General Marshall', status: 'break', zone: 'Section 104', subRole: 'general_staff' },
  { id: 'staff-5', name: 'Emma Watson', role: 'Gate Inspector', status: 'deployed', zone: 'Gate B', subRole: 'general_staff' },
  { id: 'staff-6', name: 'Dr. Lucas', role: 'Emergency Doctor', status: 'deployed', zone: 'Medical Station 1', subRole: 'medical_staff' },
  { id: 'staff-7', name: 'David Smith', role: 'Patrol Officer', status: 'available', zone: 'South Concourse', subRole: 'security_lead' }
];

export default function Staff() {
  const [staffList, setStaffList] = useState(mockStaff);
  const [filterRole, setFilterRole] = useState('All');

  // Modal States
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('Patrol Officer');
  const [newStaffZone, setNewStaffZone] = useState('North Concourse');
  const [newStaffStatus, setNewStaffStatus] = useState('available');

  const [reassignStaffId, setReassignStaffId] = useState(null);
  const [newZoneSelection, setNewZoneSelection] = useState('North Concourse');

  const filteredStaff = staffList.filter((s) => {
    if (filterRole === 'All') return true;
    if (filterRole === 'Security') return s.subRole === 'security_lead';
    if (filterRole === 'Medical') return s.subRole === 'medical_staff';
    if (filterRole === 'Operations') return s.subRole === 'operations_manager' || s.subRole === 'general_staff';
    return true;
  });

  const handleDeployStaff = () => {
    if (!newStaffName.trim()) return;

    let subRole = 'general_staff';
    const roleLower = newStaffRole.toLowerCase();
    if (roleLower.includes('security') || roleLower.includes('patrol')) {
      subRole = 'security_lead';
    } else if (roleLower.includes('medical') || roleLower.includes('doctor')) {
      subRole = 'medical_staff';
    } else if (roleLower.includes('manager')) {
      subRole = 'operations_manager';
    }

    const newStaff = {
      id: `staff-${Date.now()}`,
      name: newStaffName,
      role: newStaffRole,
      status: newStaffStatus,
      zone: newStaffZone,
      subRole
    };

    setStaffList((prev) => [...prev, newStaff]);
    setShowDeployModal(false);
    setNewStaffName('');
  };

  const handleOpenReassign = (person) => {
    setReassignStaffId(person.id);
    setNewZoneSelection(person.zone);
  };

  const handleSaveReassignment = () => {
    setStaffList((prev) =>
      prev.map((s) => (s.id === reassignStaffId ? { ...s, zone: newZoneSelection } : s))
    );
    setReassignStaffId(null);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available':
        return <UserCheck size={18} color="var(--accent-green)" />;
      case 'deployed':
        return <ShieldAlert size={18} color="var(--accent-blue)" />;
      case 'break':
        return <Coffee size={18} color="var(--accent-amber)" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    const stylesMap = {
      available: { bg: 'rgba(34,197,94,0.15)', color: 'var(--accent-green)' },
      deployed: { bg: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)' },
      break: { bg: 'rgba(245,158,11,0.15)', color: 'var(--accent-amber)' }
    };
    const current = stylesMap[status] || { bg: 'rgba(255,255,255,0.05)', color: '#fff' };

    return (
      <span style={{
        padding: '4px 8px',
        borderRadius: '20px',
        background: current.bg,
        color: current.color,
        fontSize: '12px',
        fontWeight: 600,
        textTransform: 'capitalize'
      }}>
        {status}
      </span>
    );
  };

  return (
    <div className="page-container" id="staff-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, fontSize: '28px', color: 'var(--text-primary)' }}>Staff Resource Deployment</h1>
          <p className="page-subtitle" style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>Assign tasks, check deployment status, and trace personnel locations</p>
        </div>
        <button
          id="btn-add-staff"
          className="btn-primary"
          onClick={() => setShowDeployModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--gradient-blue)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
        >
          <UserPlus size={18} />
          Deploy New Staff
        </button>
      </div>

      {/* Stats Summary */}
      <div className="staff-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius)', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Active Personnel</div>
            <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '5px', color: 'var(--text-primary)' }}>
              {staffList.filter(s => s.status !== 'break').length + 135}
            </div>
          </div>
          <div style={{ padding: '12px', borderRadius: '50%', background: 'rgba(59,130,246,0.1)' }}><UserCheck color="var(--accent-blue)" /></div>
        </div>
        <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius)', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Security Deployed</div>
            <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '5px', color: 'var(--text-primary)' }}>
              {staffList.filter(s => s.subRole === 'security_lead' && s.status === 'deployed').length + 76}
            </div>
          </div>
          <div style={{ padding: '12px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)' }}><ShieldAlert color="var(--accent-red)" /></div>
        </div>
        <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius)', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Medical Deployed</div>
            <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '5px', color: 'var(--text-primary)' }}>
              {staffList.filter(s => s.subRole === 'medical_staff' && s.status === 'deployed').length + 22}
            </div>
          </div>
          <div style={{ padding: '12px', borderRadius: '50%', background: 'rgba(34,197,94,0.1)' }}><Award color="var(--accent-green)" /></div>
        </div>
        <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius)', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>On Break</div>
            <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '5px', color: 'var(--text-primary)' }}>
              {staffList.filter(s => s.status === 'break').length + 38}
            </div>
          </div>
          <div style={{ padding: '12px', borderRadius: '50%', background: 'rgba(245,158,11,0.1)' }}><Coffee color="var(--accent-amber)" /></div>
        </div>
      </div>

      {/* Role Filter Selector */}
      <div className="filter-wrapper" style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {['All', 'Security', 'Medical', 'Operations'].map((role) => (
          <button
            key={role}
            id={`btn-filter-role-${role.toLowerCase()}`}
            onClick={() => setFilterRole(role)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              background: filterRole === role ? 'var(--accent-blue)' : 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: filterRole === role ? '1px solid var(--accent-blue)' : '1px solid var(--border-primary)',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
          >
            {role}
          </button>
        ))}
      </div>

      {/* Grid of Staff cards */}
      <div className="staff-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {filteredStaff.map((person) => (
          <div
            key={person.id}
            id={`staff-card-${person.id}`}
            className="card"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius)',
              padding: '20px',
              boxShadow: 'var(--glow-blue)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>{person.name}</h4>
                <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>{person.role}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                {getStatusIcon(person.status)}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '20px 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
              <MapPin size={16} color="var(--accent-cyan)" />
              <span>Assigned: <strong>{person.zone}</strong></span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {getStatusBadge(person.status)}
              <button
                id={`btn-reassign-${person.id}`}
                className="btn-secondary"
                onClick={() => handleOpenReassign(person)}
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-primary)',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                Reassign Zone
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Deploy Staff Modal */}
      {showDeployModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(10, 11, 22, 0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius)', padding: '24px', width: '90%', maxWidth: '450px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)', boxSizing: 'border-box'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Deploy New Staff</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Jenkins"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  style={{
                    width: '100%', padding: '10px', background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-primary)', color: 'var(--text-primary)',
                    borderRadius: 'var(--radius-sm)', boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>Role</label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value)}
                  style={{
                    width: '100%', padding: '10px', background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-primary)', color: 'var(--text-primary)',
                    borderRadius: 'var(--radius-sm)', boxSizing: 'border-box'
                  }}
                >
                  <option value="Operations Manager">Operations Manager</option>
                  <option value="Security Lead">Security Lead</option>
                  <option value="Patrol Officer">Patrol Officer</option>
                  <option value="Medical Specialist">Medical Specialist</option>
                  <option value="Emergency Doctor">Emergency Doctor</option>
                  <option value="Gate Inspector">Gate Inspector</option>
                  <option value="General Marshall">General Marshall</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>Initial Zone Assignment</label>
                <select
                  value={newStaffZone}
                  onChange={(e) => setNewStaffZone(e.target.value)}
                  style={{
                    width: '100%', padding: '10px', background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-primary)', color: 'var(--text-primary)',
                    borderRadius: 'var(--radius-sm)', boxSizing: 'border-box'
                  }}
                >
                  <option value="North Concourse">North Concourse</option>
                  <option value="South Concourse">South Concourse</option>
                  <option value="East Concourse">East Concourse</option>
                  <option value="West Concourse">West Concourse</option>
                  <option value="Gate A">Gate A</option>
                  <option value="Gate B">Gate B</option>
                  <option value="Gate C">Gate C</option>
                  <option value="Gate D">Gate D</option>
                  <option value="Section 101">Section 101</option>
                  <option value="Section 103">Section 103</option>
                  <option value="Section 104">Section 104</option>
                  <option value="Section 105">Section 105</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>Status</label>
                <select
                  value={newStaffStatus}
                  onChange={(e) => setNewStaffStatus(e.target.value)}
                  style={{
                    width: '100%', padding: '10px', background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-primary)', color: 'var(--text-primary)',
                    borderRadius: 'var(--radius-sm)', boxSizing: 'border-box'
                  }}
                >
                  <option value="available">Available</option>
                  <option value="deployed">Deployed</option>
                  <option value="break">On Break</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => setShowDeployModal(false)}
                style={{
                  padding: '8px 16px', background: 'transparent', color: 'var(--text-secondary)',
                  border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeployStaff}
                style={{
                  padding: '8px 16px', background: 'var(--gradient-blue)', color: '#fff',
                  border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600
                }}
              >
                Deploy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reassign Zone Modal */}
      {reassignStaffId && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(10, 11, 22, 0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius)', padding: '24px', width: '90%', maxWidth: '400px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)', boxSizing: 'border-box'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)' }}>
              Reassign Zone for {staffList.find(s => s.id === reassignStaffId)?.name}
            </h3>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>New Zone</label>
              <select
                value={newZoneSelection}
                onChange={(e) => setNewZoneSelection(e.target.value)}
                style={{
                  width: '100%', padding: '10px', background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-primary)', color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-sm)', boxSizing: 'border-box'
                }}
              >
                <option value="North Concourse">North Concourse</option>
                <option value="South Concourse">South Concourse</option>
                <option value="East Concourse">East Concourse</option>
                <option value="West Concourse">West Concourse</option>
                <option value="Gate A">Gate A</option>
                <option value="Gate B">Gate B</option>
                <option value="Gate C">Gate C</option>
                <option value="Gate D">Gate D</option>
                <option value="Section 101">Section 101</option>
                <option value="Section 103">Section 103</option>
                <option value="Section 104">Section 104</option>
                <option value="Section 105">Section 105</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => setReassignStaffId(null)}
                style={{
                  padding: '8px 16px', background: 'transparent', color: 'var(--text-secondary)',
                  border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveReassignment}
                style={{
                  padding: '8px 16px', background: 'var(--gradient-blue)', color: '#fff',
                  border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600
                }}
              >
                Reassign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

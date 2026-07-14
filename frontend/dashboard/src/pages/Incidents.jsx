import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AlertTriangle,
  Search,
  Filter,
  Clock,
  CheckCircle,
  Eye,
  XCircle,
} from 'lucide-react';
import AlertTable from '../components/AlertTable';
import { useDashboard } from '../App';

const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api`;

/* ── Demo alerts ───────────────────────────────────────────────── */
function generateDemoAlerts() {
  const types = ['overcrowding', 'security', 'medical', 'fire'];
  const severities = ['critical', 'high', 'medium', 'low'];
  const zones = ['sec-101', 'sec-102', 'sec-103', 'sec-104', 'sec-105', 'sec-106', 'concourse-n', 'concourse-s', 'gate-a'];
  const statuses = ['open', 'acknowledged', 'resolved'];
  const staff = ['Officer Chen', 'Officer Patel', 'Steward Kumar', 'Medic Rodriguez', ''];

  return Array.from({ length: 18 }, (_, i) => ({
    id: `demo-alert-${i + 1}`,
    type: types[i % types.length],
    severity: severities[i % severities.length],
    zone: zones[i % zones.length],
    status: statuses[i % statuses.length],
    message: `${types[i % types.length]} detected in ${zones[i % zones.length]} area — threshold exceeded`,
    timestamp: new Date(Date.now() - i * 180000).toISOString(),
    assignedTo: staff[i % staff.length] || undefined,
    density: 0.5 + Math.random() * 0.45,
    recommendedAction: 'Deploy additional security personnel. Monitor crowd flow and consider redirecting traffic.',
  }));
}

export default function Incidents() {
  const { alerts: liveAlerts, setAlerts: setLiveAlerts, setAlertsCount } = useDashboard();

  const [demoAlerts, setDemoAlerts] = useState(generateDemoAlerts);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  /* Merge live + demo alerts */
  const allAlerts = useMemo(() => {
    const merged = [...liveAlerts, ...demoAlerts];
    const seen = new Set();
    return merged.filter((a) => {
      const id = a.id || a._id;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [liveAlerts, demoAlerts]);

  /* Fetch from API on mount */
  useEffect(() => {
    async function fetchAlerts() {
      try {
        const res = await fetch(`${API_BASE}/alerts`);
        if (res.ok) {
          const data = await res.json();
          const fetchedAlerts = Array.isArray(data) ? data : data.alerts || [];
          if (fetchedAlerts.length > 0) {
            setLiveAlerts((prev) => {
              const ids = new Set(prev.map((a) => a.id || a._id));
              const newOnes = fetchedAlerts.filter((a) => !ids.has(a.id || a._id));
              return [...newOnes, ...prev];
            });
          }
        }
      } catch {
        /* Backend not available, use demo data */
      }
    }
    fetchAlerts();
  }, [setLiveAlerts]);

  /* Filters */
  const filteredAlerts = useMemo(() => {
    return allAlerts.filter((a) => {
      if (filterSeverity !== 'all' && a.severity !== filterSeverity) return false;
      if (filterType !== 'all' && a.type !== filterType) return false;
      if (filterStatus !== 'all' && a.status !== filterStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const haystack = `${a.type} ${a.zone} ${a.message || ''} ${a.assignedTo || ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [allAlerts, filterSeverity, filterType, filterStatus, searchQuery]);

  /* Stats */
  const openCount = allAlerts.filter((a) => a.status === 'open').length;
  const ackCount = allAlerts.filter((a) => a.status === 'acknowledged').length;
  const resolvedCount = allAlerts.filter((a) => a.status === 'resolved').length;
  const avgResponseTime = '4m 32s';

  /* Actions */
  const updateAlertStatus = useCallback(async (alertId, newStatus) => {
    try {
      await fetch(`${API_BASE}/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      /* offline mode — just update locally */
    }

    /* Update local state regardless */
    setLiveAlerts((prev) =>
      prev.map((a) => {
        const id = a.id || a._id;
        return id === alertId ? { ...a, status: newStatus, updatedAt: new Date().toISOString() } : a;
      })
    );

    setDemoAlerts((prev) =>
      prev.map((a) => {
        const id = a.id || a._id;
        return id === alertId ? { ...a, status: newStatus, updatedAt: new Date().toISOString() } : a;
      })
    );

    if (newStatus === 'resolved') {
      setAlertsCount((c) => Math.max(0, c - 1));
    }
  }, [setLiveAlerts, setAlertsCount, setDemoAlerts]);

  const handleAcknowledge = (id) => updateAlertStatus(id, 'acknowledged');
  const handleResolve = (id) => updateAlertStatus(id, 'resolved');

  return (
    <div className="animate-fade-in" id="incidents-page">
      <div className="page-header">
        <h1>Incident Management</h1>
        <p className="page-subtitle">Monitor, triage, and resolve stadium alerts</p>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar" id="incident-stats-bar">
        <div className="stat-item">
          <XCircle size={16} style={{ color: 'var(--accent-red)' }} />
          <span className="stat-label">Open</span>
          <span className="stat-value" style={{ color: 'var(--accent-red)' }}>{openCount}</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <Eye size={16} style={{ color: 'var(--accent-amber)' }} />
          <span className="stat-label">Acknowledged</span>
          <span className="stat-value" style={{ color: 'var(--accent-amber)' }}>{ackCount}</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <CheckCircle size={16} style={{ color: 'var(--accent-green)' }} />
          <span className="stat-label">Resolved</span>
          <span className="stat-value" style={{ color: 'var(--accent-green)' }}>{resolvedCount}</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <Clock size={16} style={{ color: 'var(--accent-blue)' }} />
          <span className="stat-label">Avg Response</span>
          <span className="stat-value">{avgResponseTime}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar" id="incident-filter-bar">
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search alerts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 36, minWidth: 220 }}
            id="incident-search-input"
          />
        </div>

        <select
          className="form-select"
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          id="filter-severity"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select
          className="form-select"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          id="filter-type"
        >
          <option value="all">All Types</option>
          <option value="overcrowding">Overcrowding</option>
          <option value="security">Security</option>
          <option value="medical">Medical</option>
          <option value="fire">Fire</option>
        </select>

        <select
          className="form-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          id="filter-status"
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="resolved">Resolved</option>
        </select>

        <span style={{ marginLeft: 'auto', fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
          {filteredAlerts.length} result{filteredAlerts.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Alert Table */}
      <AlertTable
        alerts={filteredAlerts}
        onAcknowledge={handleAcknowledge}
        onResolve={handleResolve}
      />
    </div>
  );
}

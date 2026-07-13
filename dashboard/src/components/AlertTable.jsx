import React, { useState } from 'react';
import {
  AlertTriangle,
  Users,
  Flame,
  ShieldAlert,
  Volume2,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Eye,
  Clock,
} from 'lucide-react';

function relativeTime(timestamp) {
  if (!timestamp) return '—';
  const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const typeIcons = {
  overcrowding: Users,
  fire: Flame,
  security: ShieldAlert,
  medical: AlertTriangle,
  default: AlertTriangle,
};

function getTypeIcon(type) {
  const Icon = typeIcons[type?.toLowerCase()] || typeIcons.default;
  return <Icon size={15} />;
}

export default function AlertTable({ alerts = [], onAcknowledge, onResolve, onAssign }) {
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (alerts.length === 0) {
    return (
      <div className="glass-card" id="alert-table-empty">
        <div className="card-body" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
          <AlertTriangle size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p>No alerts to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card" id="alert-table-container">
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table" id="alert-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>SEV</th>
              <th>Type</th>
              <th>Zone</th>
              <th>Time</th>
              <th>Status</th>
              <th>Assigned</th>
              <th style={{ width: 60 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert, idx) => {
              const alertId = alert.id || alert._id || `alert-${idx}`;
              const isExpanded = expandedId === alertId;
              const isNew = alert._isNew;

              return (
                <React.Fragment key={alertId}>
                  <tr
                    className={isNew ? 'new-alert-row' : ''}
                    onClick={() => toggleExpand(alertId)}
                    id={`alert-row-${alertId}`}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <span
                        className={`severity-dot ${alert.severity || 'medium'}`}
                        title={alert.severity}
                      />
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {getTypeIcon(alert.type)}
                        <span style={{ textTransform: 'capitalize' }}>{alert.type || 'Unknown'}</span>
                      </span>
                    </td>
                    <td className="cell-mono">{alert.zone || alert.zoneId || '—'}</td>
                    <td className="cell-mono">{relativeTime(alert.timestamp || alert.createdAt)}</td>
                    <td>
                      <span className={`badge ${(alert.status || 'open').toLowerCase()}`}>
                        {alert.status || 'Open'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {alert.assignedTo || '—'}
                    </td>
                    <td>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr>
                      <td colSpan={7} style={{ padding: 0 }}>
                        <div className="alert-detail-panel" id={`alert-detail-${alertId}`}>
                          <div className="alert-detail-grid">
                            <div className="alert-detail-item">
                              <div className="detail-label">Description</div>
                              <div className="detail-value">
                                {alert.message || alert.description || `${alert.type} detected in ${alert.zone || 'zone'}`}
                              </div>
                            </div>
                            <div className="alert-detail-item">
                              <div className="detail-label">Recommended Action</div>
                              <div className="detail-value">
                                {alert.recommendedAction || 'Deploy additional staff to area. Monitor density levels.'}
                              </div>
                            </div>
                            <div className="alert-detail-item">
                              <div className="detail-label">Density Level</div>
                              <div className="detail-value">
                                {alert.density != null ? `${(alert.density * 100).toFixed(0)}%` : 'N/A'}
                              </div>
                            </div>
                            <div className="alert-detail-item">
                              <div className="detail-label">Alert ID</div>
                              <div className="detail-value cell-mono" style={{ fontSize: '0.8rem' }}>
                                {alertId}
                              </div>
                            </div>
                          </div>

                          {/* Timeline */}
                          <div style={{ marginTop: 12 }}>
                            <div className="detail-label" style={{ marginBottom: 10 }}>Timeline</div>
                            <div className="alert-timeline">
                              <div className="timeline-entry">
                                <div className="timeline-time">{relativeTime(alert.timestamp || alert.createdAt)}</div>
                                <div className="timeline-text">Alert created</div>
                              </div>
                              {alert.status === 'acknowledged' || alert.status === 'resolved' ? (
                                <div className="timeline-entry">
                                  <div className="timeline-time">{relativeTime(alert.acknowledgedAt || alert.updatedAt)}</div>
                                  <div className="timeline-text">Alert acknowledged</div>
                                </div>
                              ) : null}
                              {alert.status === 'resolved' && (
                                <div className="timeline-entry">
                                  <div className="timeline-time">{relativeTime(alert.resolvedAt || alert.updatedAt)}</div>
                                  <div className="timeline-text">Alert resolved</div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="alert-actions">
                            {alert.status !== 'acknowledged' && alert.status !== 'resolved' && (
                              <button
                                className="btn btn-warning btn-sm"
                                id={`btn-ack-${alertId}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAcknowledge && onAcknowledge(alertId);
                                }}
                              >
                                <Eye size={14} /> Acknowledge
                              </button>
                            )}
                            {alert.status !== 'resolved' && (
                              <button
                                className="btn btn-success btn-sm"
                                id={`btn-resolve-${alertId}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onResolve && onResolve(alertId);
                                }}
                              >
                                <CheckCircle size={14} /> Resolve
                              </button>
                            )}
                            {alert.severity === 'critical' && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--accent-red)', fontSize: '0.8rem' }}>
                                <Volume2 size={14} /> Sound Alert
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

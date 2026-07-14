import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, Bell, ShieldAlert, CheckCircle, RefreshCw, ChevronDown } from 'lucide-react';
import { useSocket, useUnread } from '../App';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

const itemVariants = {
  initial: { opacity: 0, x: -16 },
  animate: (i) => ({
    opacity: 1, x: 0,
    transition: { delay: 0.05 + i * 0.05, duration: 0.35 },
  }),
  exit: { opacity: 0, x: 16, transition: { duration: 0.2 } },
};

const severityConfig = {
  critical: {
    Icon: ShieldAlert, color: 'var(--accent-red)',
    bg: 'rgba(239,68,68,0.12)', label: 'Critical',
  },
  high: {
    Icon: AlertTriangle, color: 'var(--accent-gold)',
    bg: 'rgba(245,158,11,0.12)', label: 'High',
  },
  medium: {
    Icon: Info, color: 'var(--accent-cyan)',
    bg: 'rgba(6,182,212,0.12)', label: 'Medium',
  },
  low: {
    Icon: CheckCircle, color: 'var(--accent-green)',
    bg: 'rgba(34,197,94,0.12)', label: 'Low',
  },
  info: {
    Icon: Bell, color: 'var(--accent-blue)',
    bg: 'rgba(59,130,246,0.12)', label: 'Info',
  },
};

const fallbackNotifications = [
  { id: 'n1', title: 'Gate C Congestion Alert', message: 'Gate C (South) is experiencing heavy congestion. Consider using Gate A or Gate D for exit.', severity: 'high', timestamp: new Date(Date.now() - 120000).toISOString(), read: false },
  { id: 'n2', title: 'Half-Time Entertainment', message: 'Half-time show starts in 10 minutes! Head to your seats for an amazing performance.', severity: 'info', timestamp: new Date(Date.now() - 300000).toISOString(), read: false },
  { id: 'n3', title: 'Weather Advisory', message: 'Light rain expected in 30 minutes. Covered seating areas are available in Sections 101-103.', severity: 'medium', timestamp: new Date(Date.now() - 600000).toISOString(), read: true },
  { id: 'n4', title: 'Food Court Special', message: 'Buy one get one free on all beverages at the North Food Court until the 70th minute!', severity: 'low', timestamp: new Date(Date.now() - 900000).toISOString(), read: true },
  { id: 'n5', title: 'Lost & Found', message: 'Items found today can be claimed at the Guest Services desk near Gate A.', severity: 'info', timestamp: new Date(Date.now() - 1200000).toISOString(), read: true },
];

const styles = {
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: { fontFamily: "'Outfit', sans-serif", fontSize: '1.5rem', fontWeight: 700 },
  refreshBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '8px 14px', borderRadius: 'var(--radius-full)',
    background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
    color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 500,
    cursor: 'pointer', transition: 'all 0.2s ease',
  },
  emergencyBanner: {
    borderRadius: 'var(--radius)', padding: '16px 18px',
    background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(236,72,153,0.15))',
    border: '1px solid rgba(239,68,68,0.3)',
    marginBottom: 16,
    animation: 'pulse 3s ease-in-out infinite',
  },
  emergencyTitle: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '1rem',
    color: 'var(--accent-red)', marginBottom: 6,
  },
  emergencyText: { fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  card: {
    display: 'flex', gap: 14, padding: 16, borderRadius: 'var(--radius)',
    background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
    backdropFilter: 'blur(16px)',
    transition: 'background 0.2s ease',
    position: 'relative', cursor: 'pointer',
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  cardContent: { flex: 1, minWidth: 0 },
  cardTitle: {
    fontWeight: 600, fontSize: '0.9375rem', marginBottom: 4,
    display: 'flex', alignItems: 'center', gap: 8,
  },
  unreadDot: {
    width: 8, height: 8, borderRadius: '50%',
    background: 'var(--accent-blue)', flexShrink: 0,
    boxShadow: '0 0 6px rgba(59,130,246,0.5)',
  },
  cardMessage: { fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 6 },
  cardTime: { fontSize: '0.6875rem', color: 'var(--text-muted)' },
  pullIndicator: {
    textAlign: 'center', padding: '12px 0',
    color: 'var(--text-muted)', fontSize: '0.75rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  empty: {
    textAlign: 'center', padding: 60,
    color: 'var(--text-muted)', fontSize: '0.9375rem',
  },
};

export default function Alerts() {
  const socket = useSocket();
  const { setUnreadCount } = useUnread();
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const computeUnread = useCallback((list) => {
    const count = list.filter((n) => !n.read).length;
    setUnreadCount(count);
    return count;
  }, [setUnreadCount]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/notifications/fan1`);
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.notifications || [];
      if (list.length > 0) {
        const mapped = list.map((n, i) => ({
          id: n.id || `api-n-${i}`,
          title: n.title || 'Notification',
          message: n.message || n.body || '',
          severity: n.severity || n.type || 'info',
          timestamp: n.timestamp || n.created_at || new Date().toISOString(),
          read: n.read ?? false,
        }));
        setNotifications(mapped);
        computeUnread(mapped);
      } else {
        setNotifications(fallbackNotifications);
        computeUnread(fallbackNotifications);
      }
    } catch {
      setNotifications(fallbackNotifications);
      computeUnread(fallbackNotifications);
    } finally {
      setInitialLoad(false);
    }
  }, [computeUnread]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  /* Real-time notifications */
  useEffect(() => {
    if (!socket) return;
    const handler = (data) => {
      const newNotif = {
        id: data.id || `live-${Date.now()}`,
        title: data.title || 'New Alert',
        message: data.message || data.body || '',
        severity: data.severity || data.type || 'info',
        timestamp: data.timestamp || new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => {
        const updated = [newNotif, ...prev];
        computeUnread(updated);
        return updated;
      });
    };
    socket.on('notification:fan', handler);
    return () => { socket.off('notification:fan', handler); };
  }, [socket, computeUnread]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setTimeout(() => setRefreshing(false), 600);
  };

  const markRead = (id) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      computeUnread(updated);
      return updated;
    });
  };

  const formatTime = (ts) => {
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return date.toLocaleDateString();
  };

  const criticalAlerts = notifications.filter((n) => n.severity === 'critical');

  return (
    <motion.div className="page" variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <div style={styles.header}>
        <h1 style={styles.title} id="alerts-title">Alerts</h1>
        <button
          style={styles.refreshBtn}
          onClick={handleRefresh}
          id="alerts-refresh-btn"
          aria-label="Refresh notifications"
        >
          <RefreshCw
            size={14}
            style={{
              transition: 'transform 0.6s ease',
              transform: refreshing ? 'rotate(360deg)' : 'none',
            }}
          />
          Refresh
        </button>
      </div>

      {/* Pull indicator */}
      <div style={styles.pullIndicator}>
        <ChevronDown size={14} /> Pull to refresh
      </div>

      {/* Emergency Banner */}
      <AnimatePresence>
        {criticalAlerts.length > 0 && (
          <motion.div
            style={styles.emergencyBanner}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            id="alerts-emergency-banner"
          >
            <div style={styles.emergencyTitle}>
              <ShieldAlert size={18} /> Emergency Alert
            </div>
            <div style={styles.emergencyText}>
              {criticalAlerts[0].message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification List */}
      {initialLoad ? (
        <div style={styles.list}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={`skel-${i}`}
              style={{
                ...styles.card,
                height: 90,
                background: 'linear-gradient(90deg, var(--glass-bg) 25%, rgba(255,255,255,0.08) 50%, var(--glass-bg) 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s ease-in-out infinite',
              }}
            />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div style={styles.empty} id="alerts-empty">
          <Bell size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          No notifications yet
        </div>
      ) : (
        <div style={styles.list} id="alerts-list">
          <AnimatePresence>
            {notifications.map((notif, i) => {
              const sev = severityConfig[notif.severity] || severityConfig.info;
              const SevIcon = sev.Icon;

              return (
                <motion.div
                  key={notif.id}
                  custom={i}
                  variants={itemVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  style={{
                    ...styles.card,
                    background: notif.read ? 'var(--glass-bg)' : 'rgba(255,255,255,0.04)',
                  }}
                  onClick={() => markRead(notif.id)}
                  id={`alert-item-${notif.id}`}
                >
                  <div style={{ ...styles.iconWrap, background: sev.bg }}>
                    <SevIcon size={18} color={sev.color} />
                  </div>

                  <div style={styles.cardContent}>
                    <div style={styles.cardTitle}>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {notif.title}
                      </span>
                      {!notif.read && <span style={styles.unreadDot} />}
                    </div>
                    <div style={styles.cardMessage}>{notif.message}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`badge badge--${notif.severity === 'critical' ? 'red' : notif.severity === 'high' ? 'gold' : notif.severity === 'medium' ? 'cyan' : notif.severity === 'low' ? 'green' : 'blue'}`}>
                        {sev.label}
                      </span>
                      <span style={styles.cardTime}>{formatTime(notif.timestamp)}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

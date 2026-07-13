import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, Map, Compass, Bell, Users, Zap, ChevronRight, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSocket, useAuth } from '../App';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

const cardVariants = {
  initial: { opacity: 0, y: 30, scale: 0.95 },
  animate: (i) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: 0.15 + i * 0.08, duration: 0.45, ease: 'easeOut' },
  }),
};

const quickActions = [
  { label: 'AI Assistant', desc: 'Ask anything', Icon: MessageSquare, path: '/chat', gradient: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', id: 'home-action-chat' },
  { label: 'Navigate', desc: 'Find your way', Icon: Map, path: '/navigate', gradient: 'linear-gradient(135deg, #06b6d4, #22c55e)', id: 'home-action-navigate' },
  { label: 'Explore', desc: 'Food & merch', Icon: Compass, path: '/explore', gradient: 'linear-gradient(135deg, #f59e0b, #f97316)', id: 'home-action-explore' },
  { label: 'Alerts', desc: 'Stay informed', Icon: Bell, path: '/alerts', gradient: 'linear-gradient(135deg, #ef4444, #ec4899)', id: 'home-action-alerts' },
  { label: 'Schedule', desc: 'World Cup 2026 matches', Icon: Calendar, path: '/schedule', gradient: 'linear-gradient(135deg, #a855f7, #6366f1)', id: 'home-action-schedule' },
];

const styles = {
  hero: {
    position: 'relative',
    borderRadius: 'var(--radius)',
    overflow: 'hidden',
    padding: '28px 20px 24px',
    marginBottom: 20,
    background: 'linear-gradient(160deg, #131740 0%, #1e2a6e 50%, #0a0e27 100%)',
    border: '1px solid var(--glass-border)',
  },
  heroBgOrb1: {
    position: 'absolute', top: -40, right: -40,
    width: 140, height: 140, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(59,130,246,0.25), transparent 70%)',
    pointerEvents: 'none',
  },
  heroBgOrb2: {
    position: 'absolute', bottom: -30, left: -20,
    width: 100, height: 100, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(6,182,212,0.2), transparent 70%)',
    pointerEvents: 'none',
  },
  heroSubtitle: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '4px 12px', borderRadius: 'var(--radius-full)',
    background: 'rgba(245,158,11,0.15)', color: 'var(--accent-gold)',
    fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase',
    letterSpacing: '0.08em', marginBottom: 12,
  },
  heroTitle: {
    fontFamily: "'Outfit', sans-serif", fontSize: '1.625rem',
    fontWeight: 700, lineHeight: 1.2, marginBottom: 4,
  },
  stadiumName: {
    fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 20,
  },
  matchCard: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
    padding: '14px 16px', borderRadius: 'var(--radius-sm)',
    background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)',
    marginBottom: 16,
  },
  teamName: { fontWeight: 600, fontSize: '1rem', textAlign: 'center', minWidth: 60 },
  matchScore: {
    fontFamily: "'Outfit', sans-serif", fontSize: '1.75rem',
    fontWeight: 700, letterSpacing: 2,
    background: 'var(--gradient-primary)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  matchMinute: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: '0.75rem', color: 'var(--accent-green)', fontWeight: 600,
  },
  liveDot: {
    width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-green)',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  crowdRow: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: '0.875rem', color: 'var(--text-secondary)',
  },
  crowdCount: { fontWeight: 700, color: 'var(--accent-cyan)', fontSize: '1rem' },
  grid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20,
  },
  actionCard: {
    padding: '20px 16px', borderRadius: 'var(--radius)',
    background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
    backdropFilter: 'blur(16px)', cursor: 'pointer',
    transition: 'transform 0.25s ease, box-shadow 0.25s ease, background 0.3s ease',
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
  },
  actionLabel: {
    fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: '0.9375rem',
  },
  actionDesc: { fontSize: '0.75rem', color: 'var(--text-muted)' },
  densityBanner: {
    borderRadius: 'var(--radius)', padding: '16px 18px',
    background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
    backdropFilter: 'blur(16px)',
  },
  densityTitle: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: '0.9375rem',
    marginBottom: 12,
  },
  gateRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  gateName: { fontSize: '0.8125rem', color: 'var(--text-secondary)' },
  gateBar: {
    height: 6, borderRadius: 3, overflow: 'hidden',
    background: 'rgba(255,255,255,0.06)', width: 100,
  },
};

const defaultDensity = [
  { gate: 'Gate A (North)', level: 0.35, color: 'var(--accent-green)' },
  { gate: 'Gate B (East)', level: 0.7, color: 'var(--accent-gold)' },
  { gate: 'Gate C (South)', level: 0.9, color: 'var(--accent-red)' },
  { gate: 'Gate D (West)', level: 0.5, color: 'var(--accent-cyan)' },
];

export default function Home() {
  const navigate = useNavigate();
  const socket = useSocket();
  const { user, logout } = useAuth();
  const [crowdCount, setCrowdCount] = useState(47832);
  const [zoneCounts, setZoneCounts] = useState({});
  const [density, setDensity] = useState(defaultDensity);

  const totalCrowdCount = Object.values(zoneCounts).reduce((a, b) => a + b, 0) || crowdCount;

  useEffect(() => {
    /* Fetch initial density values from API on mount */
    async function fetchInitialDensity() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/crowd/density`);
        if (res.ok) {
          const data = await res.json();
          const initialCounts = {};
          const gateMap = {
            'gate-a': 'Gate A (North)',
            'gate-b': 'Gate B (East)',
            'gate-c': 'Gate C (South)',
            'gate-d': 'Gate D (West)'
          };

          Object.entries(data).forEach(([zoneId, val]) => {
            initialCounts[zoneId] = val.current_count !== undefined ? val.current_count : (val.estimated_count || 0);
          });
          setZoneCounts(initialCounts);

          setDensity((prev) =>
            prev.map((g) => {
              const zoneId = Object.keys(gateMap).find(k => gateMap[k] === g.gate);
              if (zoneId && data[zoneId]) {
                const level = data[zoneId].percentage !== undefined ? data[zoneId].percentage / 100 : g.level;
                const color = level > 0.8 ? 'var(--accent-red)' : level > 0.6 ? 'var(--accent-gold)' : level > 0.4 ? 'var(--accent-cyan)' : 'var(--accent-green)';
                return { ...g, level, color };
              }
              return g;
            })
          );
        }
      } catch (err) {
        console.error('[Home] Failed to fetch initial density:', err);
      }
    }
    fetchInitialDensity();
  }, []);

  useEffect(() => {
    /* Animate fallback crowd counter if backend is offline */
    const interval = setInterval(() => {
      setCrowdCount((prev) => prev + Math.floor(Math.random() * 5 - 2));
    }, 4000);

    /* Listen for real-time density updates */
    if (socket) {
      socket.on('crowd:density', (data) => {
        if (data && data.zone_id) {
          const zoneId = data.zone_id;
          const count = data.current_count !== undefined ? data.current_count : (data.estimated_count || 0);

          setZoneCounts((prev) => ({
            ...prev,
            [zoneId]: count
          }));

          const gateMap = {
            'gate-a': 'Gate A (North)',
            'gate-b': 'Gate B (East)',
            'gate-c': 'Gate C (South)',
            'gate-d': 'Gate D (West)'
          };

          if (gateMap[zoneId]) {
            const level = data.percentage !== undefined ? data.percentage / 100 : (data.density || 0);
            const color = level > 0.8 ? 'var(--accent-red)' : level > 0.6 ? 'var(--accent-gold)' : level > 0.4 ? 'var(--accent-cyan)' : 'var(--accent-green)';

            setDensity((prev) =>
              prev.map((g) =>
                g.gate === gateMap[zoneId] ? { ...g, level, color } : g
              )
            );
          }
        }
      });
    }

    return () => {
      clearInterval(interval);
      if (socket) socket.off('crowd:density');
    };
  }, [socket]);

  return (
    <motion.div className="page" variants={pageVariants} initial="initial" animate="animate" exit="exit">
      {/* Welcome Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, padding: '0 4px' }} id="home-welcome-bar">
        <div style={{ fontSize: '0.875rem', color: '#fff' }}>
          Welcome back, <strong style={{ color: 'var(--accent-cyan)' }}>{user?.name || 'Fan'}</strong>!
        </div>
        <button
          onClick={logout}
          style={{
            background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 10, padding: '6px 12px', color: '#fff', fontSize: '0.75rem',
            fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
          }}
          id="btn-logout"
        >
          Log Out
        </button>
      </div>

      {/* Hero */}
      <div style={styles.hero} id="home-hero">
        <div style={styles.heroBgOrb1} />
        <div style={styles.heroBgOrb2} />
        <div style={styles.heroSubtitle}>
          <Zap size={12} /> Live Event
        </div>
        <h1 style={styles.heroTitle}>FIFA World Cup 2026</h1>
        <p style={styles.stadiumName}>MetLife Stadium, New Jersey</p>

        {/* Match Score */}
        <div style={styles.matchCard} id="home-match-card">
          <div>
            <div style={styles.teamName}>🇧🇷 BRA</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={styles.matchScore}>2 – 1</div>
            <div style={styles.matchMinute}>
              <span style={styles.liveDot} /> 67&apos;
            </div>
          </div>
          <div>
            <div style={styles.teamName}>ARG 🇦🇷</div>
          </div>
        </div>

        {/* Crowd counter */}
        <div style={styles.crowdRow}>
          <Users size={16} color="var(--accent-cyan)" />
          <span>
            <span style={styles.crowdCount}>{totalCrowdCount.toLocaleString()}</span> fans in stadium
          </span>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div style={styles.grid}>
        {quickActions.map(({ label, desc, Icon, path, gradient, id }, i) => (
          <motion.div
            key={id}
            custom={i}
            variants={cardVariants}
            initial="initial"
            animate="animate"
            style={{ ...styles.actionCard, gridColumn: i === 4 ? '1 / span 2' : 'span 1' }}
            id={id}
            onClick={() => navigate(path)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px) scale(1.03)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.35)';
              e.currentTarget.style.background = 'var(--bg-card-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.background = 'var(--glass-bg)';
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate(path)}
          >
            <div style={{ ...styles.iconWrap, background: gradient }}>
              <Icon size={22} />
            </div>
            <div>
              <div style={styles.actionLabel}>{label}</div>
              <div style={styles.actionDesc}>{desc}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Live Density Banner */}
      <motion.div
        style={styles.densityBanner}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.45 }}
        id="home-density-banner"
      >
        <div style={styles.densityTitle}>
          <Zap size={16} color="var(--accent-gold)" />
          Live Gate Congestion
        </div>
        {density.map(({ gate, level, color }) => (
          <div style={styles.gateRow} key={gate}>
            <span style={styles.gateName}>{gate}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={styles.gateBar}>
                <div
                  style={{
                    height: '100%',
                    width: `${level * 100}%`,
                    borderRadius: 3,
                    background: color,
                    transition: 'width 0.6s ease',
                  }}
                />
              </div>
              <span style={{ fontSize: '0.6875rem', fontWeight: 600, color, minWidth: 32, textAlign: 'right' }}>
                {Math.round(level * 100)}%
              </span>
            </div>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}

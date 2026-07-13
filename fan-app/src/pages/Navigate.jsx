import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navigation, Clock, MapPin, ChevronRight, AlertTriangle } from 'lucide-react';
import { useSocket, useAuth } from '../App';

const API = 'http://localhost:3001';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

/* Zone definitions for the SVG stadium map (IDs aligned with backend database definitions) */
const zones = [
  { id: 'sec-101', label: '101', cx: 200, cy: 80, type: 'section' },
  { id: 'sec-102', label: '102', cx: 305, cy: 115, type: 'section' },
  { id: 'sec-103', label: '103', cx: 350, cy: 210, type: 'section' },
  { id: 'sec-104', label: '104', cx: 305, cy: 305, type: 'section' },
  { id: 'sec-105', label: '105', cx: 200, cy: 340, type: 'section' },
  { id: 'sec-106', label: '106', cx: 95, cy: 305, type: 'section' },
  { id: 'sec-107', label: '107', cx: 50, cy: 210, type: 'section' },
  { id: 'sec-108', label: '108', cx: 95, cy: 115, type: 'section' },
  { id: 'gate-a', label: 'Gate A', cx: 200, cy: 30, type: 'gate' },
  { id: 'gate-b', label: 'Gate B', cx: 385, cy: 210, type: 'gate' },
  { id: 'gate-c', label: 'Gate C', cx: 200, cy: 390, type: 'gate' },
  { id: 'gate-d', label: 'Gate D', cx: 15, cy: 210, type: 'gate' },
  { id: 'food-court-1', label: 'Food 1', cx: 130, cy: 70, type: 'amenity' },
  { id: 'food-court-2', label: 'Food 2', cx: 270, cy: 345, type: 'amenity' },
  { id: 'vip-lounge', label: 'VIP', cx: 340, cy: 140, type: 'amenity' },
  { id: 'medical-1', label: 'Med 1', cx: 60, cy: 310, type: 'amenity' },
];

const allDestinations = zones.map((z) => ({ value: z.id, label: z.label + (z.type === 'section' ? ` (Section)` : z.type === 'gate' ? ' (Gate)' : ' (Amenity)') }));

const densityColor = (level) => {
  if (level > 0.8) return '#ef4444';
  if (level > 0.6) return '#f59e0b';
  if (level > 0.4) return '#06b6d4';
  return '#22c55e';
};

const defaultDensityMap = {};
zones.forEach((z) => {
  defaultDensityMap[z.id] = z.type === 'gate' ? 0.5 : 0.3;
});
defaultDensityMap['sec-103'] = 0.75;
defaultDensityMap['sec-105'] = 0.85;
defaultDensityMap['gate-c'] = 0.9;

const styles = {
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: { fontFamily: "'Outfit', sans-serif", fontSize: '1.5rem', fontWeight: 700 },
  mapContainer: {
    borderRadius: 'var(--radius)', overflow: 'hidden',
    background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
    padding: 12, marginBottom: 16, backdropFilter: 'blur(16px)',
  },
  controls: {
    display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16,
  },
  routeInfo: {
    borderRadius: 'var(--radius)', padding: 16,
    background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
    backdropFilter: 'blur(16px)', marginBottom: 16,
  },
  routeHeader: {
    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
    fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: '1rem',
  },
  step: {
    display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0',
    borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.875rem',
    color: 'var(--text-secondary)',
  },
  stepIcon: {
    width: 24, height: 24, borderRadius: '50%', background: 'rgba(59,130,246,0.15)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    color: 'var(--accent-blue)', fontSize: '0.6875rem', fontWeight: 700, marginTop: 2,
  },
  legend: {
    display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginTop: 12,
  },
  legendItem: {
    display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.6875rem',
    color: 'var(--text-muted)',
  },
  legendDot: { width: 8, height: 8, borderRadius: '50%' },
};

export default function Navigate() {
  const socket = useSocket();
  const { user } = useAuth();
  const location = useLocation();
  const [densityMap, setDensityMap] = useState(defaultDensityMap);
  const [selectedZone, setSelectedZone] = useState(null);
  const [startPoint, setStartPoint] = useState(location.state?.from_zone || user?.zone_id || 'gate-a');
  const [destination, setDestination] = useState(location.state?.destination || '');
  const [route, setRoute] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  useEffect(() => {
    if (socket) {
      socket.on('crowd:density', (data) => {
        if (data && data.zone_id) {
          setDensityMap((prev) => ({
            ...prev,
            [data.zone_id]: data.percentage !== undefined ? data.percentage / 100 : (data.density || 0)
          }));
        }
      });
    }
    return () => { if (socket) socket.off('crowd:density'); };
  }, [socket]);

  const handleNavigate = async () => {
    if (!destination || !startPoint) return;
    setLoadingRoute(true);
    setRoute(null);
    try {
      const res = await fetch(`${API}/api/navigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fan_id: user?.id || 'fan1',
          from_zone: startPoint,
          to_zone: destination,
        }),
      });
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      
      // Calculate travel instructions dynamically from route path
      const formattedSteps = data.route.map((node, index) => {
        if (index === 0) return { instruction: `Start route from ${node.replace(/-/g, ' ').toUpperCase()}` };
        return { instruction: `Move toward ${node.replace(/-/g, ' ').toUpperCase()}` };
      });

      setRoute({
        estimated_time: `${Math.round(data.estimated_time / 60)} min`,
        distance: `${data.distance * 55}m`,
        steps: formattedSteps,
        path: data.route
      });
    } catch {
      setRoute({
        estimated_time: '~4 min',
        distance: '~220m',
        steps: [
          { instruction: `Exit ${startPoint.replace(/-/g, ' ').toUpperCase()} to the concourse` },
          { instruction: `Walk toward ${destination.replace(/-/g, ' ').toUpperCase()}` },
          { instruction: 'Arrive at your destination' },
        ],
        path: [startPoint, destination],
      });
    } finally {
      setLoadingRoute(false);
    }
  };

  const isOnRoute = (zoneId) => route?.path?.includes(zoneId);
  const userZone = zones.find((z) => z.id === startPoint);

  return (
    <motion.div className="page" variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <div style={styles.header}>
        <h1 style={styles.title} id="navigate-title">Navigate</h1>
        <div className="badge badge--cyan">
          <MapPin size={10} /> Live Map
        </div>
      </div>

      {/* Controls */}
      <div style={styles.controls}>
        <div style={{ display: 'flex', gap: 10, width: '100%', boxSizing: 'border-box' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>From</label>
            <select
              className="select"
              style={{ width: '100%', boxSizing: 'border-box' }}
              value={startPoint}
              onChange={(e) => setStartPoint(e.target.value)}
              id="navigate-start-select"
            >
              {allDestinations.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>To</label>
            <select
              className="select"
              style={{ width: '100%', boxSizing: 'border-box' }}
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              id="navigate-destination-select"
            >
              <option value="">Select destination…</option>
              {allDestinations.filter((d) => d.value !== startPoint).map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          className="btn btn--primary"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px' }}
          onClick={handleNavigate}
          disabled={!destination || !startPoint || loadingRoute}
          id="navigate-go-btn"
        >
          <Navigation size={16} />
          {loadingRoute ? 'Calculating Route…' : 'Calculate Route'}
        </button>
      </div>

      {/* Stadium Map */}
      <div style={styles.mapContainer} id="navigate-map-container">
        <svg viewBox="0 0 400 420" style={{ width: '100%', height: 'auto' }}>
          {/* Outer ring (concourse) */}
          <ellipse cx="200" cy="210" rx="195" ry="205" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="30" />
          {/* Inner ring (seating area) */}
          <ellipse cx="200" cy="210" rx="155" ry="165" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="18" />
          {/* Field */}
          <ellipse cx="200" cy="210" rx="80" ry="55" fill="rgba(34,197,94,0.12)" stroke="rgba(34,197,94,0.3)" strokeWidth="1.5" />
          <text x="200" y="214" textAnchor="middle" fill="rgba(34,197,94,0.5)" fontSize="11" fontFamily="Inter, sans-serif" fontWeight="600">
            FIELD
          </text>

          {/* Route path */}
          {route?.path && route.path.length >= 2 && (() => {
            const pathZones = route.path.map((pid) => zones.find((z) => z.id === pid)).filter(Boolean);
            if (pathZones.length < 2) return null;
            const d = pathZones.map((z, i) => `${i === 0 ? 'M' : 'L'} ${z.cx} ${z.cy}`).join(' ');
            return (
              <>
                <path d={d} fill="none" stroke="rgba(59,130,246,0.3)" strokeWidth="6" strokeLinecap="round" />
                <path d={d} fill="none" stroke="var(--accent-blue)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="8 4">
                  <animate attributeName="stroke-dashoffset" values="24;0" dur="1.5s" repeatCount="indefinite" />
                </path>
              </>
            );
          })()}

          {/* Zone markers */}
          {zones.map((zone) => {
            const density = densityMap[zone.id] ?? 0.3;
            const color = densityColor(density);
            const isUser = zone.id === startPoint;
            const isDest = zone.id === destination;
            const onRoute = isOnRoute(zone.id);
            let radius = zone.type === 'section' ? 22 : zone.type === 'gate' ? 16 : 14;
            if (isDest) radius += 3;

            return (
              <g
                key={zone.id}
                onClick={() => {
                  setSelectedZone(zone.id === selectedZone ? null : zone.id);
                  if (zone.id !== startPoint) setDestination(zone.id);
                }}
                style={{ cursor: 'pointer' }}
                id={`map-zone-${zone.id}`}
              >
                {/* Density fill */}
                <circle
                  cx={zone.cx} cy={zone.cy} r={radius}
                  fill={color} opacity={0.2 + density * 0.35}
                  stroke={isDest ? 'var(--accent-blue)' : onRoute ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.15)'}
                  strokeWidth={isDest ? 2.5 : 1}
                />
                {/* Label */}
                <text
                  x={zone.cx} y={zone.cy + 1}
                  textAnchor="middle" dominantBaseline="middle"
                  fill="#fff" fontSize={zone.type === 'section' ? 10 : 8}
                  fontFamily="Inter, sans-serif" fontWeight="600"
                >
                  {zone.label}
                </text>

                {/* User location pulse */}
                {isUser && (
                  <>
                    <circle cx={zone.cx} cy={zone.cy} r="5" fill="var(--accent-blue)">
                      <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
                    </circle>
                    <circle cx={zone.cx} cy={zone.cy} r="5" fill="none" stroke="var(--accent-blue)" strokeWidth="2">
                      <animate attributeName="r" values="5;18;5" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
                    </circle>
                  </>
                )}

                {/* Destination pin */}
                {isDest && (
                  <circle cx={zone.cx} cy={zone.cy - radius - 6} r="4" fill="var(--accent-blue)">
                    <animate attributeName="cy" values={`${zone.cy - radius - 8};${zone.cy - radius - 4};${zone.cy - radius - 8}`} dur="1.2s" repeatCount="indefinite" />
                  </circle>
                )}
              </g>
            );
          })}

          {/* Your Location label */}
          {userZone && (
            <text
              x={userZone.cx} y={userZone.cy + 32}
              textAnchor="middle" fill="var(--accent-blue)"
              fontSize="8" fontFamily="Inter, sans-serif" fontWeight="600"
            >
              📍 You
            </text>
          )}
        </svg>

        {/* Legend */}
        <div style={styles.legend}>
          {[
            { label: 'Low', color: '#22c55e' },
            { label: 'Medium', color: '#06b6d4' },
            { label: 'High', color: '#f59e0b' },
            { label: 'Critical', color: '#ef4444' },
          ].map(({ label, color }) => (
            <div key={label} style={styles.legendItem}>
              <span style={{ ...styles.legendDot, background: color }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Route Info */}
      {route && (
        <motion.div
          style={styles.routeInfo}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          id="navigate-route-info"
        >
          <div style={styles.routeHeader}>
            <Navigation size={18} color="var(--accent-blue)" />
            Directions
          </div>

          <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
            <div className="badge badge--blue">
              <Clock size={10} /> {route.estimated_time || route.estimatedTime || '~4 min'}
            </div>
            <div className="badge badge--cyan">
              <MapPin size={10} /> {route.distance || '~180m'}
            </div>
          </div>

          {(route.steps || route.directions || []).map((step, i) => (
            <div style={styles.step} key={i}>
              <div style={styles.stepIcon}>{i + 1}</div>
              <span>{step.instruction || step.text || step}</span>
            </div>
          ))}
        </motion.div>
      )}

      {/* Selected zone info */}
      {selectedZone && (
        <motion.div
          style={{ ...styles.routeInfo, marginTop: 0 }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          id="navigate-zone-detail"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600 }}>
              {zones.find((z) => z.id === selectedZone)?.label}
            </span>
            <span className="badge" style={{
              background: `${densityColor(densityMap[selectedZone] ?? 0.3)}22`,
              color: densityColor(densityMap[selectedZone] ?? 0.3),
            }}>
              {Math.round((densityMap[selectedZone] ?? 0.3) * 100)}% full
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

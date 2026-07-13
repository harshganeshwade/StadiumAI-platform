import React, { useState, useMemo, useEffect } from 'react';
import { MapPin, Maximize2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useDashboard } from '../App';

/* ── Zone definitions ──────────────────────────────────────────── */
const ZONES = [
  { id: 'sec-101', label: 'Sec 101', capacity: 5000, angle: 0 },
  { id: 'sec-102', label: 'Sec 102', capacity: 5000, angle: 45 },
  { id: 'sec-103', label: 'Sec 103', capacity: 5000, angle: 90 },
  { id: 'sec-104', label: 'Sec 104', capacity: 5000, angle: 135 },
  { id: 'sec-105', label: 'Sec 105', capacity: 5000, angle: 180 },
  { id: 'sec-106', label: 'Sec 106', capacity: 5000, angle: 225 },
  { id: 'sec-107', label: 'Sec 107', capacity: 5000, angle: 270 },
  { id: 'sec-108', label: 'Sec 108', capacity: 5000, angle: 315 },
];

const CONCOURSES = [
  { id: 'concourse-n', label: 'North Concourse', capacity: 3000 },
  { id: 'concourse-s', label: 'South Concourse', capacity: 3000 },
  { id: 'concourse-e', label: 'East Concourse', capacity: 2500 },
  { id: 'concourse-w', label: 'West Concourse', capacity: 2500 },
];

const GATES = [
  { id: 'gate-a', label: 'Gate A', position: 'N' },
  { id: 'gate-b', label: 'Gate B', position: 'E' },
  { id: 'gate-c', label: 'Gate C', position: 'S' },
  { id: 'gate-d', label: 'Gate D', position: 'W' },
];

const FACILITIES = [
  { id: 'food-1', label: 'Food Court', x: 380, y: 80 },
  { id: 'food-2', label: 'Food Court', x: 120, y: 420 },
  { id: 'vip-lounge', label: 'VIP Lounge', x: 400, y: 420 },
  { id: 'medical', label: 'Medical', x: 90, y: 120 },
];

/* Generate random demo data for each zone */
function generateDemoData() {
  const data = {};
  [...ZONES, ...CONCOURSES].forEach((z) => {
    const density = 0.2 + Math.random() * 0.7;
    data[z.id] = {
      zoneId: z.id,
      density,
      currentCount: Math.round(density * z.capacity),
      capacity: z.capacity,
    };
  });
  return data;
}

function densityColor(d) {
  if (d >= 0.85) return '#ef4444';
  if (d >= 0.7) return '#f97316';
  if (d >= 0.5) return '#eab308';
  return '#22c55e';
}

function densityLabel(d) {
  if (d >= 0.85) return 'Critical';
  if (d >= 0.7) return 'High';
  if (d >= 0.5) return 'Medium';
  return 'Low';
}

const STAFF_DEMO = [
  'Officer Chen', 'Officer Patel', 'Officer Smith',
  'Steward Johnson', 'Steward Kumar', 'Medic Rodriguez',
];

function getAssignedStaff(zoneId) {
  const seed = zoneId.charCodeAt(zoneId.length - 1);
  const count = 1 + (seed % 3);
  return STAFF_DEMO.slice(seed % 3, seed % 3 + count);
}

/* ── SVG helpers ───────────────────────────────────────────────── */
function ellipseArcPath(cx, cy, rx, ry, startAngle, endAngle) {
  const rad = (a) => (a * Math.PI) / 180;
  const x1 = cx + rx * Math.cos(rad(startAngle));
  const y1 = cy + ry * Math.sin(rad(startAngle));
  const x2 = cx + rx * Math.cos(rad(endAngle));
  const y2 = cy + ry * Math.sin(rad(endAngle));
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${rx} ${ry} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

export default function CrowdMap() {
  const { crowdData: liveCrowdData } = useDashboard();
  const [demoData] = useState(generateDemoData);
  const [selectedZone, setSelectedZone] = useState(null);

  const crowdData = useMemo(() => {
    return { ...demoData, ...liveCrowdData };
  }, [demoData, liveCrowdData]);

  /* Stats */
  const allZoneIds = [...ZONES, ...CONCOURSES].map((z) => z.id);
  const totalCapacity = [...ZONES, ...CONCOURSES].reduce((s, z) => s + z.capacity, 0);
  const totalCurrent = allZoneIds.reduce((s, id) => s + (crowdData[id]?.currentCount || 0), 0);
  const highestZone = allZoneIds.reduce((best, id) => {
    const d = crowdData[id]?.density || 0;
    return d > (crowdData[best]?.density || 0) ? id : best;
  }, allZoneIds[0]);

  const selectedData = selectedZone ? crowdData[selectedZone] : null;
  const selectedMeta = selectedZone
    ? [...ZONES, ...CONCOURSES].find((z) => z.id === selectedZone)
    : null;

  /* Mini chart data for side panel */
  const miniChartData = useMemo(() => {
    if (!selectedZone) return [];
    return Array.from({ length: 10 }, (_, i) => ({
      time: `${i * 3}m`,
      density: Math.max(10, Math.min(95, ((selectedData?.density || 0.5) * 100) + (Math.random() - 0.5) * 20)),
    }));
  }, [selectedZone, selectedData]);

  const CX = 250, CY = 250;
  const INNER_RX = 80, INNER_RY = 55;
  const SEAT_RX = 170, SEAT_RY = 130;
  const OUTER_RX = 220, OUTER_RY = 180;

  return (
    <div className="animate-fade-in" id="crowd-map-page">
      <div className="page-header">
        <h1>Crowd Density Map</h1>
        <p className="page-subtitle">Real-time stadium occupancy visualization</p>
      </div>

      {/* Stats bar */}
      <div className="stats-bar" id="crowd-stats-bar">
        <div className="stat-item">
          <span className="stat-label">Total Capacity</span>
          <span className="stat-value">{totalCapacity.toLocaleString()}</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-label">Current Total</span>
          <span className="stat-value">{totalCurrent.toLocaleString()}</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-label">Highest Density</span>
          <span className="stat-value" style={{ color: densityColor(crowdData[highestZone]?.density || 0) }}>
            {[...ZONES, ...CONCOURSES].find((z) => z.id === highestZone)?.label || highestZone}
            {' '}({((crowdData[highestZone]?.density || 0) * 100).toFixed(0)}%)
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="color-legend mb-md" id="density-legend">
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginRight: 4 }}>Density:</span>
        <div className="legend-item"><div className="legend-swatch" style={{ background: '#22c55e' }} /> Low (&lt;50%)</div>
        <div className="legend-item"><div className="legend-swatch" style={{ background: '#eab308' }} /> Medium (50-70%)</div>
        <div className="legend-item"><div className="legend-swatch" style={{ background: '#f97316' }} /> High (70-85%)</div>
        <div className="legend-item"><div className="legend-swatch" style={{ background: '#ef4444' }} /> Critical (&gt;85%)</div>
      </div>

      <div className="stadium-container" id="stadium-container">
        {/* SVG Map */}
        <div className="stadium-svg-wrapper" id="stadium-svg-wrapper">
          <svg viewBox="0 0 500 500" width="100%" height="100%" style={{ maxHeight: 560 }}>
            {/* Outer stadium border */}
            <ellipse cx={CX} cy={CY} rx={OUTER_RX + 8} ry={OUTER_RY + 8} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={2} />

            {/* Concourse sections (outer ring) */}
            {/* North */}
            <path
              d={ellipseArcPath(CX, CY, OUTER_RX, OUTER_RY, 225, 315)}
              fill={densityColor(crowdData['concourse-n']?.density || 0.3)}
              className="zone"
              opacity={0.7}
              id="zone-concourse-n"
              onClick={() => setSelectedZone('concourse-n')}
            />
            {/* East */}
            <path
              d={ellipseArcPath(CX, CY, OUTER_RX, OUTER_RY, 315, 45)}
              fill={densityColor(crowdData['concourse-e']?.density || 0.4)}
              className="zone"
              opacity={0.7}
              id="zone-concourse-e"
              onClick={() => setSelectedZone('concourse-e')}
            />
            {/* South */}
            <path
              d={ellipseArcPath(CX, CY, OUTER_RX, OUTER_RY, 45, 135)}
              fill={densityColor(crowdData['concourse-s']?.density || 0.5)}
              className="zone"
              opacity={0.7}
              id="zone-concourse-s"
              onClick={() => setSelectedZone('concourse-s')}
            />
            {/* West */}
            <path
              d={ellipseArcPath(CX, CY, OUTER_RX, OUTER_RY, 135, 225)}
              fill={densityColor(crowdData['concourse-w']?.density || 0.35)}
              className="zone"
              opacity={0.7}
              id="zone-concourse-w"
              onClick={() => setSelectedZone('concourse-w')}
            />

            {/* Inner seating sections (8 sectors) */}
            {ZONES.map((zone) => {
              const startAngle = zone.angle - 22.5;
              const endAngle = zone.angle + 22.5;
              const d = crowdData[zone.id]?.density || 0.4;
              return (
                <path
                  key={zone.id}
                  d={ellipseArcPath(CX, CY, SEAT_RX, SEAT_RY, startAngle, endAngle)}
                  fill={densityColor(d)}
                  className="zone"
                  opacity={0.8}
                  id={`zone-${zone.id}`}
                  onClick={() => setSelectedZone(zone.id)}
                />
              );
            })}

            {/* Central field */}
            <ellipse cx={CX} cy={CY} rx={INNER_RX} ry={INNER_RY} fill="#1a3a1a" stroke="#22c55e" strokeWidth={1.5} opacity={0.7} />
            <text x={CX} y={CY - 6} textAnchor="middle" fill="#22c55e" fontSize={13} fontWeight={600}>FIELD</text>
            <text x={CX} y={CY + 10} textAnchor="middle" fill="#4ade80" fontSize={9} opacity={0.7}>Center Pitch</text>

            {/* Section labels */}
            {ZONES.map((zone) => {
              const rad = (zone.angle * Math.PI) / 180;
              const lx = CX + (SEAT_RX * 0.72) * Math.cos(rad);
              const ly = CY + (SEAT_RY * 0.72) * Math.sin(rad);
              const d = crowdData[zone.id]?.density || 0.4;
              return (
                <g key={`label-${zone.id}`}>
                  <text x={lx} y={ly - 5} textAnchor="middle" fill="#fff" fontSize={10} fontWeight={600}>{zone.label}</text>
                  <text x={lx} y={ly + 8} textAnchor="middle" fill="#fff" fontSize={9} fontFamily="JetBrains Mono" opacity={0.8}>
                    {(d * 100).toFixed(0)}%
                  </text>
                </g>
              );
            })}

            {/* Concourse labels */}
            <text x={CX} y={CY - OUTER_RY + 20} textAnchor="middle" fill="#94a3b8" fontSize={10} fontWeight={500}>N Concourse</text>
            <text x={CX} y={CY + OUTER_RY - 12} textAnchor="middle" fill="#94a3b8" fontSize={10} fontWeight={500}>S Concourse</text>
            <text x={CX + OUTER_RX - 30} y={CY + 4} textAnchor="middle" fill="#94a3b8" fontSize={10} fontWeight={500}>E</text>
            <text x={CX - OUTER_RX + 30} y={CY + 4} textAnchor="middle" fill="#94a3b8" fontSize={10} fontWeight={500}>W</text>

            {/* Gates */}
            {[
              { id: 'gate-a', x: CX, y: CY - OUTER_RY - 16, label: 'Gate A' },
              { id: 'gate-b', x: CX + OUTER_RX + 14, y: CY, label: 'Gate B' },
              { id: 'gate-c', x: CX, y: CY + OUTER_RY + 20, label: 'Gate C' },
              { id: 'gate-d', x: CX - OUTER_RX - 14, y: CY, label: 'Gate D' },
            ].map((g) => (
              <g key={g.id} id={`gate-marker-${g.id}`}>
                <rect x={g.x - 22} y={g.y - 9} width={44} height={18} rx={4} fill="rgba(59,130,246,0.2)" stroke="#3b82f6" strokeWidth={1} />
                <text x={g.x} y={g.y + 4} textAnchor="middle" fill="#3b82f6" fontSize={9} fontWeight={600}>{g.label}</text>
              </g>
            ))}

            {/* Facilities */}
            {FACILITIES.map((f) => (
              <g key={f.id} id={`facility-${f.id}`}>
                <rect x={f.x - 2} y={f.y - 2} width={4} height={4} rx={2} fill="#a855f7" opacity={0.8} />
                <text x={f.x + 8} y={f.y + 3} fill="#a855f7" fontSize={8} opacity={0.7}>{f.label}</text>
              </g>
            ))}
          </svg>
        </div>

        {/* Side Panel */}
        <div className="stadium-side-panel" id="zone-detail-panel">
          {selectedZone && selectedData && selectedMeta ? (
            <>
              <div className="zone-detail-title" id="zone-detail-title">
                <MapPin size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                {selectedMeta.label}
              </div>

              <div className="zone-stat-row">
                <span className="stat-label">Current Count</span>
                <span className="stat-value">{selectedData.currentCount?.toLocaleString() || 0}</span>
              </div>
              <div className="zone-stat-row">
                <span className="stat-label">Capacity</span>
                <span className="stat-value">{selectedMeta.capacity?.toLocaleString()}</span>
              </div>
              <div className="zone-stat-row">
                <span className="stat-label">Density</span>
                <span className="stat-value" style={{ color: densityColor(selectedData.density || 0) }}>
                  {((selectedData.density || 0) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="zone-stat-row">
                <span className="stat-label">Status</span>
                <span className={`badge ${densityLabel(selectedData.density || 0).toLowerCase()}`}>
                  {densityLabel(selectedData.density || 0)}
                </span>
              </div>

              {/* Density gauge */}
              <div style={{ marginTop: 12 }}>
                <div className="density-gauge">
                  <div
                    className="gauge-fill"
                    style={{
                      width: `${(selectedData.density || 0) * 100}%`,
                      background: densityColor(selectedData.density || 0),
                    }}
                  />
                </div>
              </div>

              {/* Mini bar chart */}
              <div style={{ marginTop: 20 }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 10 }}>
                  Recent Trend
                </h4>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={miniChartData}>
                    <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} hide />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(26,29,46,0.95)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 6,
                        fontSize: '0.78rem',
                      }}
                      itemStyle={{ color: '#e2e8f0' }}
                    />
                    <Bar dataKey="density" fill={densityColor(selectedData.density || 0)} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Assigned Staff */}
              <div style={{ marginTop: 16 }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Assigned Staff
                </h4>
                {getAssignedStaff(selectedZone).map((name, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 0', fontSize: '0.82rem', color: 'var(--text-primary)',
                  }}>
                    <span style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: 'var(--gradient-blue)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.65rem', color: '#fff', fontWeight: 600,
                    }}>
                      {name.split(' ').map((w) => w[0]).join('')}
                    </span>
                    {name}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: 60 }}>
              <Maximize2 size={36} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p>Select a zone on the map to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  AlertTriangle,
  Activity,
  UserCheck,
  Bell,
  Radio,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import KPICard from '../components/KPICard';
import { useDashboard } from '../App';

/* ── Demo data generators ─────────────────────────────────────── */
function generateDensityData(count = 20) {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => {
    const t = new Date(now - (count - 1 - i) * 30000);
    return {
      time: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      'North Stand': 45 + Math.random() * 30,
      'South Stand': 50 + Math.random() * 25,
      'East Wing': 35 + Math.random() * 35,
      'West Wing': 40 + Math.random() * 28,
    };
  });
}

const SEVERITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#22c55e',
};

const severityData = [
  { name: 'Critical', value: 3, color: SEVERITY_COLORS.critical },
  { name: 'High', value: 7, color: SEVERITY_COLORS.high },
  { name: 'Medium', value: 12, color: SEVERITY_COLORS.medium },
  { name: 'Low', value: 5, color: SEVERITY_COLORS.low },
];

function getEventIcon(type) {
  switch (type) {
    case 'alert': return <AlertTriangle size={15} />;
    case 'crowd': return <Users size={15} />;
    case 'staff': return <ShieldCheck size={15} />;
    default: return <Radio size={15} />;
  }
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(26,29,46,0.95)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 8,
      padding: '10px 14px',
      fontSize: '0.82rem',
    }}>
      <div style={{ color: '#94a3b8', marginBottom: 6, fontFamily: 'JetBrains Mono' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
          <span style={{ color: '#e2e8f0' }}>{p.name}: </span>
          <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 600, color: '#e2e8f0' }}>{p.value.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
};

const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, percent }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 1.6;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#94a3b8" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12}>
      {name} ({(percent * 100).toFixed(0)}%)
    </text>
  );
};

/* ── Seed events ─────────────────────────────────────────────── */
function seedEvents() {
  const types = ['alert', 'crowd', 'staff', 'info'];
  const msgs = [
    'Crowd density increased in North Stand',
    'Security patrol completed West Gate sweep',
    'Staff deployed to Section 103',
    'Medical kit restocked at Station B',
    'Gate A entry rate: 120 fans/min',
    'VIP section cleared for halftime',
    'Concession stand queue above threshold',
    'Steward reassigned to East Wing',
  ];
  return msgs.map((text, i) => ({
    id: `seed-${i}`,
    type: types[i % types.length],
    text,
    timestamp: new Date(Date.now() - i * 45000).toISOString(),
  }));
}

export default function Overview() {
  const { events: liveEvents, crowdData } = useDashboard();
  const [densityHistory, setDensityHistory] = useState(() => generateDensityData(20));

  useEffect(() => {
    const interval = setInterval(() => {
      setDensityHistory((prev) => {
        const next = [...prev.slice(1)];
        const t = new Date();
        next.push({
          time: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          'North Stand': 45 + Math.random() * 30,
          'South Stand': 50 + Math.random() * 25,
          'East Wing': 35 + Math.random() * 35,
          'West Wing': 40 + Math.random() * 28,
        });
        return next;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const events = useMemo(() => {
    const seed = seedEvents();
    const combined = [...liveEvents, ...seed];
    const seen = new Set();
    return combined.filter((e) => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    }).slice(0, 50);
  }, [liveEvents]);

  /* KPI values — use crowd data if available, otherwise realistic defaults */
  const totalFans = Object.values(crowdData).reduce((sum, z) => sum + (z.currentCount || 0), 0) || 42853;
  const avgDensity = Object.values(crowdData).length
    ? (Object.values(crowdData).reduce((s, z) => s + (z.density || 0), 0) / Object.values(crowdData).length * 100)
    : 67.4;

  return (
    <div className="animate-fade-in" id="overview-page">
      <div className="page-header">
        <h1>Operations Overview</h1>
        <p className="page-subtitle">Real-time stadium monitoring &amp; control</p>
      </div>

      {/* KPI Row */}
      <div className="kpi-grid" id="kpi-grid">
        <KPICard
          id="kpi-total-fans"
          title="Total Fans"
          value={totalFans}
          icon={Users}
          trend="+2.3%"
          trendDirection="up"
          color="blue"
          subtitle="vs last event"
        />
        <KPICard
          id="kpi-active-alerts"
          title="Active Alerts"
          value={22}
          icon={AlertTriangle}
          trend="+5"
          trendDirection="up"
          color="red"
          subtitle="3 critical"
        />
        <KPICard
          id="kpi-avg-density"
          title="Avg Density"
          value={`${avgDensity.toFixed(1)}%`}
          icon={Activity}
          trend="-1.2%"
          trendDirection="down"
          color="amber"
          subtitle="within threshold"
        />
        <KPICard
          id="kpi-staff-deployed"
          title="Staff Deployed"
          value={184}
          icon={UserCheck}
          trend="96%"
          trendDirection="up"
          color="green"
          subtitle="coverage"
        />
      </div>

      {/* Severity mini bar under active alerts */}
      <div style={{ marginTop: -12, marginBottom: 20, paddingLeft: 'calc(25% + 5px)', maxWidth: 'calc(50% - 10px)' }}>
        <div className="mini-severity-bar" id="severity-mini-bar">
          <span className="seg" style={{ flex: 3, background: SEVERITY_COLORS.critical }} />
          <span className="seg" style={{ flex: 7, background: SEVERITY_COLORS.high }} />
          <span className="seg" style={{ flex: 12, background: SEVERITY_COLORS.medium }} />
          <span className="seg" style={{ flex: 5, background: SEVERITY_COLORS.low }} />
        </div>
      </div>

      {/* Charts Row */}
      <div className="chart-grid" id="charts-row">
        {/* Density Line Chart */}
        <div className="chart-container" id="density-chart-card">
          <div className="chart-title">
            <Activity size={18} /> Real-Time Crowd Density
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={densityHistory}>
              <defs>
                <linearGradient id="gradNorth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradSouth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradEast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradWest" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 12, color: '#94a3b8' }}
                iconType="circle"
                iconSize={8}
              />
              <Area type="monotone" dataKey="North Stand" stroke="#3b82f6" fill="url(#gradNorth)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="South Stand" stroke="#22c55e" fill="url(#gradSouth)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="East Wing" stroke="#f59e0b" fill="url(#gradEast)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="West Wing" stroke="#a855f7" fill="url(#gradWest)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Severity Donut */}
        <div className="chart-container" id="severity-chart-card">
          <div className="chart-title">
            <AlertTriangle size={18} /> Alert Severity Distribution
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={severityData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={3}
                dataKey="value"
                label={PieLabel}
                animationBegin={0}
                animationDuration={800}
              >
                {severityData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'rgba(26,29,46,0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  fontSize: '0.82rem',
                }}
                itemStyle={{ color: '#e2e8f0' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Live Event Feed */}
      <div className="glass-card" id="event-feed-card">
        <div className="card-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={17} /> Live Event Feed
          </h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
            {events.length} events
          </span>
        </div>
        <div className="event-feed" id="event-feed-list">
          {events.map((ev) => (
            <div className="event-item" key={ev.id} id={`event-${ev.id}`}>
              <div className={`event-icon ${ev.type}`}>
                {getEventIcon(ev.type)}
              </div>
              <div className="event-body">
                <div className="event-text">{ev.text}</div>
                <div className="event-time">
                  {ev.timestamp
                    ? new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    : '—'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

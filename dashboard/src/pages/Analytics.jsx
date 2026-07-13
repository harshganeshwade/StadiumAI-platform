/**
 * Analytics Page (Analytics.jsx)
 * Displays historical reports and operational charts (FR-08).
 */
import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { Calendar, Download, BarChart3, TrendingUp, Clock, AlertOctagon } from 'lucide-react';

const COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#22c55e',
  blue: '#3b82f6',
  cyan: '#06b6d4',
  purple: '#a855f7'
};

// Simulated historical data
const crowdOverTimeData = [
  { time: '12:00', 'Concourses': 1500, 'Seating Sections': 200, 'Gates': 4500 },
  { time: '12:15', 'Concourses': 3200, 'Seating Sections': 800, 'Gates': 5800 },
  { time: '12:30', 'Concourses': 4800, 'Seating Sections': 2200, 'Gates': 7200 },
  { time: '12:45', 'Concourses': 6200, 'Seating Sections': 4100, 'Gates': 5500 },
  { time: '13:00', 'Concourses': 7800, 'Seating Sections': 8500, 'Gates': 3400 },
  { time: '13:15', 'Concourses': 8400, 'Seating Sections': 14000, 'Gates': 1500 },
  { time: '13:30', 'Concourses': 5500, 'Seating Sections': 24000, 'Gates': 800 },
  { time: '13:45', 'Concourses': 3100, 'Seating Sections': 32000, 'Gates': 400 },
  { time: '14:00', 'Concourses': 2200, 'Seating Sections': 41000, 'Gates': 150 }
];

const alertsByTypeData = [
  { name: 'Congestion', count: 18, color: COLORS.cyan },
  { name: 'Medical', count: 12, color: COLORS.critical },
  { name: 'Security', count: 7, color: COLORS.high },
  { name: 'Equipment', count: 15, color: COLORS.purple },
  { name: 'Weather', count: 3, color: COLORS.medium },
  { name: 'Lost Child', count: 2, color: COLORS.blue }
];

const alertResolutionData = [
  { name: 'Resolved', value: 48, color: COLORS.low },
  { name: 'Acknowledged', value: 9, color: COLORS.medium },
  { name: 'Open', value: 3, color: COLORS.critical }
];

const responseTimeData = [
  { min: '0-5m', 'Medical': 8, 'Security': 5, 'Maintenance': 12 },
  { min: '5-10m', 'Medical': 4, 'Security': 2, 'Maintenance': 8 },
  { min: '10-15m', 'Medical': 0, 'Security': 0, 'Maintenance': 4 },
  { min: '15m+', 'Medical': 0, 'Security': 0, 'Maintenance': 1 }
];

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('Last Hour');

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    csvContent += "CROWD DYNAMICS OVER TIME\n";
    csvContent += "Time,Concourses,Seating Sections,Gates\n";
    crowdOverTimeData.forEach(row => {
      csvContent += `${row.time},${row.Concourses},${row['Seating Sections']},${row.Gates}\n`;
    });
    
    csvContent += "\nALERTS BY CATEGORY\n";
    csvContent += "Category,Count\n";
    alertsByTypeData.forEach(row => {
      csvContent += `${row.name},${row.count}\n`;
    });

    csvContent += "\nALERT RESOLUTION STATUS\n";
    csvContent += "Status,Count\n";
    alertResolutionData.forEach(row => {
      csvContent += `${row.name},${row.value}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `stadium_ops_analytics_${timeRange.toLowerCase().replace(' ', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-container" id="analytics-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, fontSize: '28px', color: 'var(--text-primary)' }}>Operational Analytics</h1>
          <p className="page-subtitle" style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>Post-event auditing, response stats, and historical crowd flow trends</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="filter-select-wrapper" style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-primary)', overflow: 'hidden' }}>
            {['Last Hour', 'Last 3 Hours', 'Today'].map((range) => (
              <button
                key={range}
                id={`btn-range-${range.toLowerCase().replace(' ', '-')}`}
                onClick={() => setTimeRange(range)}
                style={{
                  padding: '8px 16px',
                  background: timeRange === range ? 'var(--accent-blue)' : 'transparent',
                  color: 'var(--text-primary)',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'background 0.2s'
                }}
              >
                {range}
              </button>
            ))}
          </div>
          <button
            id="btn-export-csv"
            className="btn-secondary"
            onClick={handleExportCSV}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer' }}
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="analytics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '24px' }}>
        
        {/* Crowd Density Flow */}
        <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius)', padding: '24px', boxShadow: 'var(--glow-blue)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <TrendingUp size={20} color="var(--accent-blue)" />
            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Crowd Dynamics Over Time</h3>
          </div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={crowdOverTimeData}>
                <defs>
                  <linearGradient id="colorSeating" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorConcourse" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.cyan} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS.cyan} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                <XAxis dataKey="time" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: '#fff' }} />
                <Legend />
                <Area type="monotone" dataKey="Seating Sections" stroke={COLORS.blue} fillOpacity={1} fill="url(#colorSeating)" />
                <Area type="monotone" dataKey="Concourses" stroke={COLORS.cyan} fillOpacity={1} fill="url(#colorConcourse)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts by Incident Type */}
        <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius)', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <AlertOctagon size={20} color="var(--accent-amber)" />
            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Alerts by Category</h3>
          </div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={alertsByTypeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                <XAxis type="number" stroke="var(--text-muted)" />
                <YAxis dataKey="name" type="category" stroke="var(--text-muted)" width={100} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: '#fff' }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {alertsByTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resolution Status Distribution */}
        <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius)', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <BarChart3 size={20} color="var(--accent-green)" />
            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Alert Resolution Rate</h3>
          </div>
          <div style={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <ResponsiveContainer width="60%" height="100%">
              <PieChart>
                <Pie
                  data={alertResolutionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {alertResolutionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: '#fff' }} />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dispatch Response Time */}
        <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius)', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Clock size={20} color="var(--accent-purple)" />
            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Response Time Distribution</h3>
          </div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                <XAxis dataKey="min" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: '#fff' }} />
                <Legend />
                <Bar dataKey="Medical" fill={COLORS.critical} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Security" fill={COLORS.high} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Maintenance" fill={COLORS.purple} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}

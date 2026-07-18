import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  Activity,
  Users,
  AlertTriangle,
  Play,
  CheckCircle2,
  Clock,
  Flame,
  Sun,
  ShieldAlert,
  UserCheck,
  RefreshCw,
  HelpCircle,
  Video
} from 'lucide-react';
import { useDashboard } from '../App';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Scenario Metadata
const SCENARIO_DETAILS = {
  normal: {
    title: 'Normal Operations',
    kpis: { safety: '99%', evacuation: '8 mins', bottleneckProb: '2%', status: 'Nominal' },
    commander: {
      active: false,
      title: 'Stadium Operating Normally',
      description: 'AI model is monitoring crowd telemetry, thermal sensors, and CCTV feeds. Zero alerts registered.',
      recommendations: [],
      playbook: []
    },
    resources: [
      { role: 'Security Patrols', current: 12, recommended: 12, status: 'Balanced' },
      { role: 'Medical Teams', current: 2, recommended: 2, status: 'Balanced' },
      { role: 'Steward/Ushers', current: 24, recommended: 24, status: 'Balanced' },
      { role: 'Volunteers', current: 40, recommended: 40, status: 'Balanced' }
    ]
  },
  surge: {
    title: 'Gate A Crowd Surge',
    kpis: { safety: '85%', evacuation: '11 mins', bottleneckProb: '96%', status: 'Congestion Alert' },
    commander: {
      active: true,
      title: 'Gate A Crowd Congestion Warning',
      cause: 'Simultaneous arrival of 6 supporter buses at North Lot.',
      prediction: 'Estimated queue wait: 14 mins. Predicted bottleneck surge to 96% density within 12 minutes.',
      recommendations: [
        'Divert incoming fans to Gate B using Dynamic Concourse Signage.',
        'Deploy 6 stewards to Gate A for queue line organization.',
        'Notify Security Patrol Alpha to open secondary metal detector lanes.',
        'Broadcast live rerouting alerts to Fan App users in North Lot.'
      ],
      playbook: [
        { task: 'Dijkstra Routing adjusted (Concourse-N weight penalty x3)', done: true },
        { task: 'Push redirect notification to incoming fans', done: true },
        { task: 'Open secondary Gate B turnstiles', done: false }
      ]
    },
    resources: [
      { role: 'Security Patrols', current: 12, recommended: 14, status: 'Divert Patrol Alpha (+2)' },
      { role: 'Medical Teams', current: 2, recommended: 2, status: 'Balanced' },
      { role: 'Steward/Ushers', current: 24, recommended: 30, status: 'Deploy 6 Stewards (+6)' },
      { role: 'Volunteers', current: 40, recommended: 40, status: 'Balanced' }
    ]
  },
  fire: {
    title: 'Sec 106 Fire Alarm',
    kpis: { safety: '42%', evacuation: '19 mins (Partial)', bottleneckProb: '99%', status: 'CRITICAL EMERGENCY' },
    commander: {
      active: true,
      title: 'Thermal Sensor Fire Alarm - Section 106',
      cause: 'Smoke anomaly detected in South Concourse catering unit.',
      prediction: 'Evacuation required for sections 105, 106, 107. High panic probability. Potential bottleneck at South exit.',
      recommendations: [
        'Initiate South Concourse Fire Evacuation Playbook.',
        'Open all emergency lanes connecting Concourse-S to Field.',
        'Dispatch 2 additional Medical Teams to Medical Station 1.',
        'Trigger automated emergency PA announcements in Spanish and English.',
        'Push emergency navigation path to Section 106 seats.'
      ],
      playbook: [
        { task: 'Rerouting algorithm forced to exclude Section 106', done: true },
        { task: 'Emergency Services (911 & Fire Dispatch) notified', done: true },
        { task: 'Multilingual evacuation warnings pushed to Fan App', done: true },
        { task: 'Open Field-VIP Access Gates for fan descent', done: false }
      ]
    },
    resources: [
      { role: 'Security Patrols', current: 12, recommended: 18, status: 'Deploy Security Leads (+6)' },
      { role: 'Medical Teams', current: 2, recommended: 5, status: 'Dispatch Medics (+3)' },
      { role: 'Steward/Ushers', current: 24, recommended: 34, status: 'Evac Stewards (+10)' },
      { role: 'Volunteers', current: 40, recommended: 20, status: 'Retreat Volunteers (-20)' }
    ]
  },
  heat: {
    title: 'Extreme Heat Index Wave',
    kpis: { safety: '92%', evacuation: '8 mins', bottleneckProb: '10%', status: 'Weather Warning' },
    commander: {
      active: true,
      title: 'Extreme Heat Index Warning (35°C)',
      cause: 'Solar peak and high relative humidity in unshaded stands.',
      prediction: 'Predicted medical incident rate increases by 250% for sections 101, 102, 108 due to direct sunlight.',
      recommendations: [
        'Increase Medical Units on standby to 4 units.',
        'Establish 4 hydration checkpoints in North and East concourses.',
        'Deploy stadium volunteers to distribute bottled water to open seating sections.',
        'Retract stadium roof by 40% to maximize shade on South Stands.'
      ],
      playbook: [
        { task: 'Deploy water stations in Concourse-N and Concourse-E', done: true },
        { task: 'Push hydration reminder to all active tickets', done: true },
        { task: 'Adjust roof angle for optimal stand shading', done: false }
      ]
    },
    resources: [
      { role: 'Security Patrols', current: 12, recommended: 12, status: 'Balanced' },
      { role: 'Medical Teams', current: 2, recommended: 4, status: 'Deploy Medics (+2)' },
      { role: 'Steward/Ushers', current: 24, recommended: 24, status: 'Balanced' },
      { role: 'Volunteers', current: 40, recommended: 50, status: 'Deploy Water Patrols (+10)' }
    ]
  }
};

export default function DemoCenter() {
  const { crowdData, addEvent } = useDashboard();
  const [activeScenario, setActiveScenario] = useState('normal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [playbookTasks, setPlaybookTasks] = useState([]);
  const [resourceAllocations, setResourceAllocations] = useState([]);

  const currentDetails = SCENARIO_DETAILS[activeScenario];

  useEffect(() => {
    setPlaybookTasks(currentDetails.commander.playbook);
    setResourceAllocations(currentDetails.resources);
  }, [activeScenario]);

  const handleTriggerScenario = async (scenarioKey) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: scenarioKey })
      });
      if (response.ok) {
        setActiveScenario(scenarioKey);
        addEvent({
          type: 'info',
          text: `Demo Simulator triggered scenario: ${SCENARIO_DETAILS[scenarioKey].title}`,
          timestamp: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('[DemoCenter] Trigger failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTask = (index) => {
    setPlaybookTasks((prev) =>
      prev.map((t, idx) => (idx === index ? { ...t, done: !t.done } : t))
    );
  };

  const handleReallocate = (index) => {
    setResourceAllocations((prev) =>
      prev.map((r, idx) =>
        idx === index ? { ...r, current: r.recommended, status: 'Balanced' } : r
      )
    );
    addEvent({
      type: 'staff',
      text: `AI recommended resource reallocation executed for ${resourceAllocations[index].role}`,
      timestamp: new Date().toISOString()
    });
  };

  // Live styling class for status
  const getStatusColor = (status) => {
    if (status === 'Nominal') return '#22c55e';
    if (status === 'Weather Warning') return '#f59e0b';
    if (status === 'Congestion Alert') return '#f97316';
    return '#ef4444';
  };

  // Stadium SVG elements helper
  const getZoneFillColor = (zoneId) => {
    if (activeScenario === 'surge') {
      if (zoneId === 'gate-a') return 'rgba(239, 68, 68, 0.85)'; // Critical Gate A
      if (zoneId === 'concourse-n') return 'rgba(249, 115, 22, 0.7)'; // High North Concourse
    } else if (activeScenario === 'fire') {
      if (zoneId === 'sec-106') return 'rgba(239, 68, 68, 0.9)'; // Fire Zone!
      if (zoneId === 'sec-105' || zoneId === 'sec-107') return 'rgba(249, 115, 22, 0.8)'; // Evacuation overflow
      if (zoneId === 'concourse-s') return 'rgba(239, 68, 68, 0.8)'; // Blocked South
    } else if (activeScenario === 'heat') {
      if (['sec-101', 'sec-102', 'sec-108', 'gate-a'].includes(zoneId)) return 'rgba(245, 158, 11, 0.7)'; // Sunny hot sides
    }
    // Return live density if available, else default green
    const live = crowdData[zoneId];
    if (live) {
      if (live.density >= 0.85) return 'rgba(239, 68, 68, 0.5)';
      if (live.density >= 0.70) return 'rgba(249, 115, 22, 0.5)';
      if (live.density >= 0.50) return 'rgba(245, 158, 11, 0.5)';
      return 'rgba(34, 197, 94, 0.4)';
    }
    return 'rgba(34, 197, 94, 0.3)'; // Normal baseline
  };

  return (
    <div style={{ padding: '24px', color: 'var(--text-primary)', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Header banner */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'linear-gradient(135deg, rgba(26,29,46,0.85) 0%, rgba(15,17,28,0.9) 100%)',
        border: '1px solid var(--border-primary)', borderRadius: 'var(--radius)',
        padding: '20px 24px', marginBottom: '24px', backdropFilter: 'blur(10px)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Sparkles size={20} style={{ color: 'var(--accent-blue)' }} />
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, letterSpacing: '-0.5px' }}>AI Simulation & Command Center</h1>
            <span style={{
              background: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)', border: '1px solid rgba(59,130,246,0.3)',
              padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px'
            }}>Demo Deck v1.2</span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
            Orchestrate stadium-day scenarios, verify the real-time GenAI operations coordination loop, and inspect live SVG digital twin responses.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '20px', textAlign: 'right' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Scenario</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: getStatusColor(currentDetails.kpis.status) }}>{currentDetails.title}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Evacuation ETA</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-secondary)' }}>{currentDetails.kpis.evacuation}</div>
          </div>
        </div>
      </div>

      {/* Main layout grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Left Column: Interactive Scenario Deck & Digital Twin */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Simulation controller */}
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius)', padding: '20px'
          }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} style={{ color: 'var(--accent-blue)' }} />
              Judge-Friendly Demo Scenarios
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              
              <button
                disabled={isSubmitting}
                onClick={() => handleTriggerScenario('normal')}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: activeScenario === 'normal' ? 'rgba(34,197,94,0.1)' : 'var(--bg-tertiary)',
                  border: activeScenario === 'normal' ? '1px solid rgba(34,197,94,0.4)' : '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-sm)', padding: '12px 16px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                }}
              >
                <div>
                  <strong style={{ display: 'block', color: activeScenario === 'normal' ? '#22c55e' : 'var(--text-primary)', fontSize: '14px' }}>1. Stadium Operating Normally</strong>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Nominal flows, gates green, zero pending incidents.</span>
                </div>
                <div style={{ padding: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}>
                  <RefreshCw size={14} className={isSubmitting && activeScenario === 'normal' ? 'spin' : ''} style={{ color: activeScenario === 'normal' ? '#22c55e' : 'var(--text-muted)' }} />
                </div>
              </button>

              <button
                disabled={isSubmitting}
                onClick={() => handleTriggerScenario('surge')}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: activeScenario === 'surge' ? 'rgba(249,115,22,0.1)' : 'var(--bg-tertiary)',
                  border: activeScenario === 'surge' ? '1px solid rgba(249,115,22,0.4)' : '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-sm)', padding: '12px 16px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                }}
              >
                <div>
                  <strong style={{ display: 'block', color: activeScenario === 'surge' ? '#f97316' : 'var(--text-primary)', fontSize: '14px' }}>2. Simulate Gate A Crowd Surge</strong>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Predictive bottleneck alert, congestion triggers at Gate A.</span>
                </div>
                <div style={{ padding: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}>
                  <Users size={14} style={{ color: activeScenario === 'surge' ? '#f97316' : 'var(--text-muted)' }} />
                </div>
              </button>

              <button
                disabled={isSubmitting}
                onClick={() => handleTriggerScenario('fire')}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: activeScenario === 'fire' ? 'rgba(239,68,68,0.1)' : 'var(--bg-tertiary)',
                  border: activeScenario === 'fire' ? '1px solid rgba(239,68,68,0.4)' : '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-sm)', padding: '12px 16px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                }}
              >
                <div>
                  <strong style={{ display: 'block', color: activeScenario === 'fire' ? '#ef4444' : 'var(--text-primary)', fontSize: '14px' }}>3. Section 106 Fire Emergency</strong>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Launches emergency playbooks, dispatch checklists, evacuations.</span>
                </div>
                <div style={{ padding: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}>
                  <Flame size={14} style={{ color: activeScenario === 'fire' ? '#ef4444' : 'var(--text-muted)' }} />
                </div>
              </button>

              <button
                disabled={isSubmitting}
                onClick={() => handleTriggerScenario('heat')}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: activeScenario === 'heat' ? 'rgba(245,158,11,0.1)' : 'var(--bg-tertiary)',
                  border: activeScenario === 'heat' ? '1px solid rgba(245,158,11,0.4)' : '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-sm)', padding: '12px 16px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                }}
              >
                <div>
                  <strong style={{ display: 'block', color: activeScenario === 'heat' ? '#eab308' : 'var(--text-primary)', fontSize: '14px' }}>4. Extreme Heat Index Warning</strong>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Requires resource redistribution & hydration checkpoint setup.</span>
                </div>
                <div style={{ padding: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}>
                  <Sun size={14} style={{ color: activeScenario === 'heat' ? '#eab308' : 'var(--text-muted)' }} />
                </div>
              </button>

            </div>
          </div>

          {/* SVG Stadium Map / Digital Twin */}
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius)', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center'
          }}>
            <h2 style={{ alignSelf: 'flex-start', margin: '0 0 12px 0', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Video size={16} style={{ color: 'var(--accent-blue)' }} />
              Live SVG Digital Twin Grid
            </h2>
            
            <svg width="280" height="280" viewBox="0 0 500 500" style={{ margin: '10px 0' }}>
              {/* Outer boundary stadium ellipse */}
              <ellipse cx="250" cy="250" rx="240" ry="240" fill="none" stroke="var(--border-primary)" strokeWidth="3" />
              
              {/* Outer circle: Seating Sections (101 - 108) */}
              {/* Sec 101 (N) */}
              <path d="M 250 250 L 250 30 A 220 220 0 0 1 405 94 Z" fill={getZoneFillColor('sec-101')} stroke="#0f111c" strokeWidth="2" />
              {/* Sec 102 (NE) */}
              <path d="M 250 250 L 405 94 A 220 220 0 0 1 470 250 Z" fill={getZoneFillColor('sec-102')} stroke="#0f111c" strokeWidth="2" />
              {/* Sec 103 (E) */}
              <path d="M 250 250 L 470 250 A 220 220 0 0 1 405 406 Z" fill={getZoneFillColor('sec-103')} stroke="#0f111c" strokeWidth="2" />
              {/* Sec 104 (SE) */}
              <path d="M 250 250 L 405 406 A 220 220 0 0 1 250 470 Z" fill={getZoneFillColor('sec-104')} stroke="#0f111c" strokeWidth="2" />
              {/* Sec 105 (S) */}
              <path d="M 250 250 L 250 470 A 220 220 0 0 1 95 406 Z" fill={getZoneFillColor('sec-105')} stroke="#0f111c" strokeWidth="2" />
              {/* Sec 106 (SW) */}
              <path d="M 250 250 L 95 406 A 220 220 0 0 1 30 250 Z" fill={getZoneFillColor('sec-106')} stroke="#0f111c" strokeWidth="2" />
              {/* Sec 107 (W) */}
              <path d="M 250 250 L 30 250 A 220 220 0 0 1 95 94 Z" fill={getZoneFillColor('sec-107')} stroke="#0f111c" strokeWidth="2" />
              {/* Sec 108 (NW) */}
              <path d="M 250 250 L 95 94 A 220 220 0 0 1 250 30 Z" fill={getZoneFillColor('sec-108')} stroke="#0f111c" strokeWidth="2" />

              {/* Inner Circle: Concourses (N, E, S, W) mask */}
              <circle cx="250" cy="250" r="140" fill="#0f111c" />
              
              {/* Concourse North */}
              <path d="M 250 250 L 151 151 A 140 140 0 0 1 349 151 Z" fill={getZoneFillColor('concourse-n')} stroke="#0f111c" strokeWidth="2" />
              {/* Concourse East */}
              <path d="M 250 250 L 349 151 A 140 140 0 0 1 349 349 Z" fill={getZoneFillColor('concourse-e')} stroke="#0f111c" strokeWidth="2" />
              {/* Concourse South */}
              <path d="M 250 250 L 349 349 A 140 140 0 0 1 151 349 Z" fill={getZoneFillColor('concourse-s')} stroke="#0f111c" strokeWidth="2" />
              {/* Concourse West */}
              <path d="M 250 250 L 151 349 A 140 140 0 0 1 151 151 Z" fill={getZoneFillColor('concourse-w')} stroke="#0f111c" strokeWidth="2" />

              {/* Center Pit: VIP Lounge & Field */}
              <circle cx="250" cy="250" r="70" fill="var(--bg-secondary)" stroke="#0f111c" strokeWidth="3" />
              <text x="250" y="240" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="700">VIP LOUNGE</text>
              <rect x="220" y="255" width="60" height="30" rx="3" fill="#22c55e" opacity="0.8" />
              <text x="250" y="274" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">FIELD</text>

              {/* Gate indicators */}
              <circle cx="250" cy="30" r="16" fill={getZoneFillColor('gate-a')} stroke="#fff" strokeWidth="2" />
              <text x="250" y="34" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="700">A</text>

              <circle cx="470" cy="250" r="16" fill={getZoneFillColor('gate-b')} stroke="#fff" strokeWidth="2" />
              <text x="470" y="254" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="700">B</text>

              <circle cx="250" cy="470" r="16" fill={getZoneFillColor('gate-c')} stroke="#fff" strokeWidth="2" />
              <text x="250" y="474" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="700">C</text>

              <circle cx="30" cy="250" r="16" fill={getZoneFillColor('gate-d')} stroke="#fff" strokeWidth="2" />
              <text x="30" y="254" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="700">D</text>

              {/* Evacuation indicators flashing */}
              {activeScenario === 'fire' && (
                <g style={{ animation: 'pulse 1.5s infinite' }}>
                  <line x1="250" y1="250" x2="250" y2="400" stroke="#ef4444" strokeWidth="4" strokeDasharray="5,5" />
                  <polygon points="250,405 245,395 255,395" fill="#ef4444" />
                  <circle cx="250" cy="250" r="15" fill="none" stroke="#ef4444" strokeWidth="2" />
                </g>
              )}
            </svg>

            {/* Color key */}
            <div style={{ display: 'flex', gap: '16px', fontSize: '11px', marginTop: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#22c55e' }} />
                <span>&lt;50% (Normal)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#f59e0b' }} />
                <span>50-70% (Medium)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#f97316' }} />
                <span>70-85% (High)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#ef4444' }} />
                <span>&gt;85% (Critical)</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: AI Operations Commander & Resource Planner */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* GenAI Incident Commander card */}
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius)', padding: '20px', flex: 1, display: 'flex', flexDirection: 'column'
          }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bot size={18} style={{ color: 'var(--accent-blue)' }} />
              GenAI Incident Commander
            </h2>

            {currentDetails.commander.active ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
                
                {/* Active alert details */}
                <div style={{
                  background: 'rgba(239,68,68,0.06)', borderLeft: '4px solid #ef4444',
                  borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', padding: '12px 16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <ShieldAlert size={16} style={{ color: '#ef4444' }} />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>{currentDetails.commander.title}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    <strong>Root Cause:</strong> {currentDetails.commander.cause}
                  </div>
                  <div style={{
                    background: 'rgba(15,17,28,0.4)', borderRadius: 'var(--radius-sm)', padding: '8px 12px',
                    fontSize: '12px', border: '1px dashed rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px'
                  }}>
                    <Clock size={14} style={{ color: 'var(--accent-blue)' }} />
                    <span><strong>Predictive AI:</strong> {currentDetails.commander.prediction}</span>
                  </div>
                </div>

                {/* AI Recommendations */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.5px' }}>
                    AI Recommendations (Tactical Coordination)
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                    {currentDetails.commander.recommendations.map((rec, i) => (
                      <li key={i} style={{ color: 'var(--text-secondary)' }}>{rec}</li>
                    ))}
                  </ul>
                </div>

                {/* playbooks */}
                <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-primary)', paddingTop: '14px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.5px' }}>
                    Emergency Playbook Action Checklist
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {playbookTasks.map((task, idx) => (
                      <div
                        key={idx}
                        onClick={() => toggleTask(idx)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px',
                          cursor: 'pointer', color: task.done ? 'var(--text-muted)' : 'var(--text-secondary)',
                          textDecoration: task.done ? 'line-through' : 'none'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={task.done}
                          readOnly
                          style={{ accentColor: 'var(--accent-blue)', cursor: 'pointer' }}
                        />
                        <span>{task.task}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                flex: 1, border: '1px dashed var(--border-primary)', borderRadius: 'var(--radius-sm)',
                padding: '40px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.01)'
              }}>
                <CheckCircle2 size={32} style={{ color: 'var(--accent-green)', marginBottom: '12px' }} />
                <h4 style={{ margin: '0 0 6px 0', fontSize: '14px' }}>{currentDetails.commander.title}</h4>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', maxWidth: '280px' }}>
                  {currentDetails.commander.description}
                </p>
              </div>
            )}
          </div>

          {/* AI Resource Allocation card */}
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius)', padding: '20px'
          }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck size={18} style={{ color: 'var(--accent-blue)' }} />
              AI Resource Allocation & Dispatch Advisor
            </h2>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-primary)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px', fontWeight: 500 }}>Resource Group</th>
                    <th style={{ padding: '8px 10px', fontWeight: 500, textAlign: 'center' }}>Current</th>
                    <th style={{ padding: '8px 10px', fontWeight: 500, textAlign: 'center' }}>Recommended</th>
                    <th style={{ padding: '8px 10px', fontWeight: 500 }}>Action Dispatch</th>
                  </tr>
                </thead>
                <tbody>
                  {resourceAllocations.map((resGroup, i) => {
                    const isBalanced = resGroup.current === resGroup.recommended;
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '10px', fontWeight: 500, color: 'var(--text-secondary)' }}>{resGroup.role}</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>{resGroup.current} units</td>
                        <td style={{ padding: '10px', textAlign: 'center', fontWeight: 600, color: isBalanced ? 'var(--text-muted)' : 'var(--accent-blue)' }}>
                          {resGroup.recommended} units
                        </td>
                        <td style={{ padding: '10px' }}>
                          {isBalanced ? (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle2 size={12} style={{ color: '#22c55e' }} /> Optimal
                            </span>
                          ) : (
                            <button
                              onClick={() => handleReallocate(i)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700,
                                textTransform: 'uppercase', padding: '4px 8px', background: 'rgba(59,130,246,0.15)',
                                color: 'var(--accent-blue)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              Dispatch Advisor
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

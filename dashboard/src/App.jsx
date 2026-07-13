import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { io } from 'socket.io-client';
import Sidebar from './components/Sidebar';
import Overview from './pages/Overview';
import CrowdMap from './pages/CrowdMap';
import Incidents from './pages/Incidents';
import Staff from './pages/Staff';
import Analytics from './pages/Analytics';

const SOCKET_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/dashboard` 
  : 'http://localhost:3001/dashboard';

export const DashboardContext = createContext(null);

export function useDashboard() {
  return useContext(DashboardContext);
}

export default function App() {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [alertsCount, setAlertsCount] = useState(0);
  const [crowdData, setCrowdData] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const s = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    s.on('connect', () => {
      setConnected(true);
      console.log('[StadiumAI] Connected to dashboard socket');
    });

    s.on('disconnect', () => {
      setConnected(false);
      console.log('[StadiumAI] Disconnected from dashboard socket');
    });

    s.on('crowd:density', (data) => {
      setCrowdData((prev) => {
        const next = { ...prev };
        const zoneId = data.zone_id || data.zoneId;
        if (zoneId) {
          next[zoneId] = {
            zoneId: zoneId,
            currentCount: data.current_count !== undefined ? data.current_count : data.currentCount,
            density: data.percentage !== undefined ? data.percentage / 100 : data.density,
            capacity: data.max_capacity !== undefined ? data.max_capacity : data.capacity,
            density_level: data.density_level,
            timestamp: data.timestamp
          };
        }
        return next;
      });
      const zId = data.zone_id || data.zoneId;
      addEvent({
        type: 'crowd',
        text: `Crowd density updated${zId ? ` in ${zId}` : ''}`,
        timestamp: new Date().toISOString(),
      });
    });

    s.on('alert:new', (alert) => {
      // Normalize alert_id
      const normalizedAlert = {
        ...alert,
        id: alert.alert_id || alert.id,
        zone: alert.zone_id || alert.zone
      };
      setAlerts((prev) => [normalizedAlert, ...prev].slice(0, 100));
      setAlertsCount((prev) => prev + 1);
      addEvent({
        type: 'alert',
        text: `New ${normalizedAlert.severity} alert: ${normalizedAlert.type} in ${normalizedAlert.zone || 'unknown zone'}`,
        timestamp: normalizedAlert.timestamp || new Date().toISOString(),
      });
    });

    s.on('alert:update', (updated) => {
      const upId = updated.alert_id || updated.id;
      setAlerts((prev) =>
        prev.map((a) => (a.alert_id === upId || a.id === upId ? { ...a, ...updated, zone: updated.zone_id || updated.zone || a.zone } : a))
      );
      addEvent({
        type: 'info',
        text: `Alert ${upId} status changed to ${updated.status}`,
        timestamp: new Date().toISOString(),
      });
    });

    s.on('staff:update', (data) => {
      addEvent({
        type: 'staff',
        text: `Staff ${data.name || data.staffId || 'member'} ${data.action || 'updated'}`,
        timestamp: new Date().toISOString(),
      });
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  const addEvent = useCallback((event) => {
    setEvents((prev) =>
      [{ ...event, id: Date.now() + Math.random() }, ...prev].slice(0, 50)
    );
  }, []);

  const contextValue = {
    socket,
    connected,
    crowdData,
    setCrowdData,
    alerts,
    setAlerts,
    alertsCount,
    setAlertsCount,
    events,
    addEvent,
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      <BrowserRouter>
        <div className="app-layout" id="app-layout">
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed((p) => !p)}
            connected={connected}
            alertsCount={alertsCount}
          />
          <main className={`main-content${sidebarCollapsed ? ' sidebar-collapsed' : ''}`} id="main-content">
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/crowd" element={<CrowdMap />} />
              <Route path="/incidents" element={<Incidents />} />
              <Route path="/staff" element={<Staff />} />
              <Route path="/analytics" element={<Analytics />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </DashboardContext.Provider>
  );
}

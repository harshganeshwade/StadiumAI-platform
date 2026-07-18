import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { createContext, useContext, useEffect, useMemo, useState, lazy, Suspense } from 'react';
import { io } from 'socket.io-client';

import BottomNav from './components/BottomNav';

const Home = lazy(() => import('./pages/Home'));
const Chat = lazy(() => import('./pages/Chat'));
const Navigate = lazy(() => import('./pages/Navigate'));
const Explore = lazy(() => import('./pages/Explore'));
const Alerts = lazy(() => import('./pages/Alerts'));
const Auth = lazy(() => import('./pages/Auth'));
const Schedule = lazy(() => import('./pages/Schedule'));

/* ---- Auth Context ---- */
export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

/* ---- Socket Context ---- */
const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);

function SocketProvider({ children }) {
  const [isConnected, setIsConnected] = useState(true);

  const socket = useMemo(() => {
    return io(import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/fan` : 'http://localhost:3001/fan', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      autoConnect: true,
    });
  }, []);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('[Socket] Connected to /fan namespace:', socket.id);
      setIsConnected(true);
    });
    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);
    });
    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={socket}>
      {!isConnected && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: '#ea4335',
          color: '#fff',
          textAlign: 'center',
          padding: '10px 16px',
          zIndex: 99999,
          fontSize: '13px',
          fontWeight: '600',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <span style={{
            display: 'inline-block',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#fff',
            opacity: 0.8
          }} />
          Reconnecting to MetLife Stadium network...
        </div>
      )}
      {children}
    </SocketContext.Provider>
  );
}

/* ---- Unread Count Context ---- */
const UnreadContext = createContext({ unreadCount: 0, setUnreadCount: () => {} });
export const useUnread = () => useContext(UnreadContext);

/* ---- Animated Routes ---- */
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/navigate" element={<Navigate />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/schedule" element={<Schedule />} />
      </Routes>
    </AnimatePresence>
  );
}

/* ---- App Shell ---- */
export default function App() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = (userData, userToken) => {
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(userToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      <SocketProvider>
        <UnreadContext.Provider value={{ unreadCount, setUnreadCount }}>
          <BrowserRouter>
            <Suspense fallback={<div className="loading" style={{ color: '#fff', padding: 20, textAlign: 'center', marginTop: 100 }}>Loading...</div>}>
              {token ? (
                <>
                  <AnimatedRoutes />
                  <BottomNav />
                </>
              ) : (
                <Auth />
              )}
            </Suspense>
          </BrowserRouter>
        </UnreadContext.Provider>
      </SocketProvider>
    </AuthContext.Provider>
  );
}

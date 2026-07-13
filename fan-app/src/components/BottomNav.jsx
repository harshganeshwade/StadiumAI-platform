import { NavLink, useLocation } from 'react-router-dom';
import { Home, MessageSquare, Map, Compass, Bell } from 'lucide-react';
import { useUnread } from '../App';

const tabs = [
  { path: '/', label: 'Home', Icon: Home, id: 'nav-home' },
  { path: '/chat', label: 'Chat', Icon: MessageSquare, id: 'nav-chat' },
  { path: '/navigate', label: 'Navigate', Icon: Map, id: 'nav-navigate' },
  { path: '/explore', label: 'Explore', Icon: Compass, id: 'nav-explore' },
  { path: '/alerts', label: 'Alerts', Icon: Bell, id: 'nav-alerts' },
];

export default function BottomNav() {
  const location = useLocation();
  const { unreadCount } = useUnread();

  /* Hide bottom nav on the chat page to give full screen */
  if (location.pathname === '/chat') return null;

  return (
    <nav className="bottom-nav" id="bottom-navigation" aria-label="Main navigation">
      {tabs.map(({ path, label, Icon, id }) => {
        const isActive = location.pathname === path;
        return (
          <NavLink
            key={path}
            to={path}
            id={id}
            className={`bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`}
            aria-label={label}
          >
            <Icon />
            <span>{label}</span>
            {id === 'nav-alerts' && unreadCount > 0 && (
              <span className="bottom-nav__badge" id="alerts-badge-count">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}

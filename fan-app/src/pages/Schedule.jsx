import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Search, Bell, MapPin, ArrowLeft, Clock, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

const itemVariants = {
  initial: { opacity: 0, y: 12 },
  animate: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: 0.05 + i * 0.05, duration: 0.35, ease: 'easeOut' },
  }),
};

const matchesData = [
  { id: 'm1', stage: 'Group Stage', teams: { home: '🇲🇽 MEX', away: '🇩🇿 ALG' }, date: 'June 11, 2026', time: '17:00 local', venue: 'Estadio Azteca, Mexico City', location: 'mexico', isMetLife: false, status: 'Upcoming' },
  { id: 'm2', stage: 'Group Stage', teams: { home: '🇨🇦 CAN', away: '🇳🇬 NGA' }, date: 'June 12, 2026', time: '16:00 local', venue: 'BMO Field, Toronto', location: 'toronto', isMetLife: false, status: 'Upcoming' },
  { id: 'm3', stage: 'Group Stage', teams: { home: '🇺🇸 USA', away: '🇯🇵 JPN' }, date: 'June 12, 2026', time: '19:00 local', venue: 'SoFi Stadium, Los Angeles', location: 'la', isMetLife: false, status: 'Upcoming' },
  { id: 'm4', stage: 'Group Stage', teams: { home: '🇧🇷 BRA', away: '🇦🇷 ARG' }, date: 'June 15, 2026', time: '20:00 local', venue: 'MetLife Stadium, East Rutherford', location: 'metlife', isMetLife: true, status: 'Live' },
  { id: 'm5', stage: 'Group Stage', teams: { home: '🇩🇪 GER', away: '🇪🇸 ESP' }, date: 'June 18, 2026', time: '18:00 local', venue: 'MetLife Stadium, East Rutherford', location: 'metlife', isMetLife: true, status: 'Upcoming' },
  { id: 'm6', stage: 'Round of 32', teams: { home: 'Winner Group A', away: 'Runner-up Group B' }, date: 'June 27, 2026', time: '15:00 local', venue: 'MetLife Stadium, East Rutherford', location: 'metlife', isMetLife: true, status: 'Upcoming' },
  { id: 'm7', stage: 'Round of 16', teams: { home: 'TBA', away: 'TBA' }, date: 'July 2, 2026', time: '18:00 local', venue: 'MetLife Stadium, East Rutherford', location: 'metlife', isMetLife: true, status: 'Upcoming' },
  { id: 'm8', stage: 'Quarter-finals', teams: { home: 'TBA', away: 'TBA' }, date: 'July 10, 2026', time: '17:00 local', venue: 'SoFi Stadium, Los Angeles', location: 'la', isMetLife: false, status: 'Upcoming' },
  { id: 'm9', stage: 'Semi-finals', teams: { home: 'TBA', away: 'TBA' }, date: 'July 14, 2026', time: '20:00 local', venue: 'Mercedes-Benz Stadium, Atlanta', location: 'atlanta', isMetLife: false, status: 'Upcoming' },
  { id: 'm10', stage: 'World Cup Final', teams: { home: 'TBA', away: 'TBA' }, date: 'July 19, 2026', time: '16:00 local', venue: 'MetLife Stadium, East Rutherford', location: 'metlife', isMetLife: true, status: 'Upcoming' },
];

export default function Schedule() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMetLife, setFilterMetLife] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const filteredMatches = matchesData.filter((match) => {
    if (filterMetLife && !match.isMetLife) return false;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const haystack = `${match.teams.home} ${match.teams.away} ${match.stage} ${match.venue}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <motion.div className="page" variants={pageVariants} initial="initial" animate="animate" exit="exit" style={{ paddingBottom: '90px' }}>
      {/* Toast Alert */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 16, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            style={{
              position: 'fixed', top: 0, left: '50%',
              background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff',
              padding: '12px 24px', borderRadius: '30px', zIndex: 2000,
              boxShadow: '0 8px 30px rgba(16,185,129,0.4)', fontSize: '0.875rem', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            <Clock size={16} />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button
          onClick={() => navigate('/')}
          className="btn btn--icon btn--secondary"
          aria-label="Go back"
          style={{ width: 38, height: 38, borderRadius: 10 }}
        >
          <ArrowLeft size={18} />
        </button>
        <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
          Match Timetable
        </h1>
      </div>

      {/* Search Input */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          className="input input--search"
          placeholder="Search by team, stage or venue..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ paddingLeft: '40px', width: '100%', boxSizing: 'border-box' }}
        />
      </div>

      {/* Venue Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          className={`btn ${filterMetLife ? 'btn--primary' : 'btn--secondary'}`}
          onClick={() => setFilterMetLife(true)}
          style={{ flex: 1, padding: '8px 12px', borderRadius: '20px', fontSize: '0.8125rem', fontWeight: 600 }}
        >
          MetLife Stadium (Host)
        </button>
        <button
          className={`btn ${!filterMetLife ? 'btn--primary' : 'btn--secondary'}`}
          onClick={() => setFilterMetLife(false)}
          style={{ flex: 1, padding: '8px 12px', borderRadius: '20px', fontSize: '0.8125rem', fontWeight: 600 }}
        >
          All Host Cities
        </button>
      </div>

      {/* Timetable List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filteredMatches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            No matches match your criteria.
          </div>
        ) : (
          filteredMatches.map((match, i) => (
            <motion.div
              key={match.id}
              custom={i}
              variants={itemVariants}
              initial="initial"
              animate="animate"
              style={{
                borderRadius: 'var(--radius)',
                padding: '16px',
                background: match.status === 'Live' ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(236, 72, 153, 0.05) 100%)' : 'var(--glass-bg)',
                border: match.status === 'Live' ? '1px solid rgba(239,68,68,0.3)' : '1px solid var(--glass-border)',
                backdropFilter: 'blur(16px)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {/* Header: Stage and Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {match.stage}
                </span>
                {match.status === 'Live' ? (
                  <span style={{
                    background: 'rgba(239, 68, 68, 0.2)', color: 'var(--accent-red)',
                    fontSize: '0.6875rem', fontWeight: 700, padding: '3px 8px', borderRadius: '10px',
                    display: 'flex', alignItems: 'center', gap: 4
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-red)', animation: 'pulse 1.5s infinite' }} />
                    LIVE
                  </span>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 600 }}>
                    {match.date}
                  </span>
                )}
              </div>

              {/* Match Teams */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '40%' }}>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                    {match.teams.home}
                  </span>
                </div>
                <div style={{ width: '20%', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem' }}>
                  VS
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '40%', alignItems: 'flex-end' }}>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                    {match.teams.away}
                  </span>
                </div>
              </div>

              {/* Match Meta: Time & Venue */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.75rem', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={12} color="var(--accent-cyan)" />
                  <span>{match.time}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={12} color="var(--accent-gold)" />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {match.venue}
                  </span>
                </div>
              </div>

              {/* Action Bar */}
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button
                  className="btn btn--secondary"
                  onClick={() => triggerToast(`Reminder scheduled for ${match.teams.home} vs ${match.teams.away}!`)}
                  style={{
                    flex: 1, padding: '8px', borderRadius: '10px', fontSize: '0.75rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer'
                  }}
                >
                  <Bell size={12} /> Set Alert
                </button>

                {match.isMetLife && (
                  <button
                    className="btn btn--primary"
                    onClick={() => navigate('/navigate')}
                    style={{
                      flex: 1, padding: '8px', borderRadius: '10px', fontSize: '0.75rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer'
                    }}
                  >
                    <MapPin size={12} /> Directions
                  </button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}

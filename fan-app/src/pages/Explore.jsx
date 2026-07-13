import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, MapPin, X, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

const cardVariants = {
  initial: { opacity: 0, y: 20, scale: 0.96 },
  animate: (i) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: 0.08 + i * 0.06, duration: 0.4, ease: 'easeOut' },
  }),
};

const categories = ['All', 'Food', 'Merchandise', 'Parking'];

const fallbackItems = [
  { id: 'r1', name: 'Stadium Burger', description: 'Premium angus patty with fresh toppings', price: '$12.99', zone: 'Sec 103', rating: 4.5, category: 'Food', emoji: '🍔' },
  { id: 'r2', name: 'Craft Beer', description: 'Local IPA selection on draft', price: '$9.50', zone: 'Sec 107', rating: 4.2, category: 'Food', emoji: '🍺' },
  { id: 'r3', name: 'Pizza Slice', description: 'NY-style hand-tossed pizza', price: '$7.99', zone: 'Sec 101', rating: 4.7, category: 'Food', emoji: '🍕' },
  { id: 'r4', name: 'Team Jersey', description: 'Official 2026 World Cup jersey', price: '$89.99', zone: 'VIP Area', rating: 4.9, category: 'Merchandise', emoji: '👕' },
  { id: 'r5', name: 'Match Scarf', description: 'Commemorative knit scarf', price: '$24.99', zone: 'Gate A', rating: 4.3, category: 'Merchandise', emoji: '🧣' },
  { id: 'r6', name: 'Souvenir Cap', description: 'Adjustable fit embroidered cap', price: '$19.99', zone: 'Gate B', rating: 4.1, category: 'Merchandise', emoji: '🧢' },
  { id: 'r7', name: 'Lot A - Standard', description: 'Closest parking to Gate A', price: '$35.00', zone: 'North Lot', rating: 3.8, category: 'Parking', emoji: '🅿️' },
  { id: 'r8', name: 'VIP Parking', description: 'Premium covered parking with shuttle', price: '$65.00', zone: 'VIP Lot', rating: 4.6, category: 'Parking', emoji: '🚗' },
  { id: 'r9', name: 'Nachos Deluxe', description: 'Loaded nachos with cheese & jalapeños', price: '$10.99', zone: 'Sec 105', rating: 4.4, category: 'Food', emoji: '🧀' },
  { id: 'r10', name: 'Mini Football', description: 'Signed replica match ball', price: '$34.99', zone: 'Gate C', rating: 4.8, category: 'Merchandise', emoji: '⚽' },
];

const styles = {
  header: { marginBottom: 16 },
  title: { fontFamily: "'Outfit', sans-serif", fontSize: '1.5rem', fontWeight: 700, marginBottom: 14 },
  searchWrap: {
    position: 'relative', marginBottom: 16,
  },
  searchIcon: {
    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
    color: 'var(--text-muted)', pointerEvents: 'none',
  },
  tabs: {
    display: 'flex', gap: 8, overflowX: 'auto',
    paddingBottom: 4, marginBottom: 16,
    scrollbarWidth: 'none', msOverflowStyle: 'none',
  },
  tab: {
    padding: '8px 18px', borderRadius: 'var(--radius-full)',
    fontSize: '0.8125rem', fontWeight: 600,
    background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
    color: 'var(--text-secondary)', whiteSpace: 'nowrap',
    transition: 'all 0.2s ease', cursor: 'pointer',
  },
  tabActive: {
    background: 'var(--gradient-primary)', color: '#fff',
    border: '1px solid transparent',
    boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
  },
  grid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
  },
  card: {
    borderRadius: 'var(--radius)', padding: 16,
    background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
    backdropFilter: 'blur(16px)',
    cursor: 'pointer',
    transition: 'transform 0.25s ease, box-shadow 0.25s ease, background 0.3s ease',
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  emoji: { fontSize: '2rem', lineHeight: 1 },
  cardName: {
    fontFamily: "'Outfit', sans-serif", fontWeight: 600,
    fontSize: '0.875rem', lineHeight: 1.3,
  },
  cardDesc: { fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 },
  cardPrice: {
    fontWeight: 700, fontSize: '1rem',
    background: 'var(--gradient-gold)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  cardMeta: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: 6, flexWrap: 'wrap',
  },
  stars: {
    display: 'flex', alignItems: 'center', gap: 2,
    fontSize: '0.6875rem', color: 'var(--accent-gold)',
  },
  zone: {
    display: 'inline-flex', alignItems: 'center', gap: 3,
    padding: '2px 8px', borderRadius: 'var(--radius-full)',
    background: 'rgba(6,182,212,0.12)', color: 'var(--accent-cyan)',
    fontSize: '0.625rem', fontWeight: 600,
  },
  empty: {
    gridColumn: '1 / -1', textAlign: 'center', padding: 40,
    color: 'var(--text-muted)', fontSize: '0.9375rem',
  },
};

export default function Explore() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('All');
  const [items, setItems] = useState(fallbackItems);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const queryParam = category === 'All' ? '' : `?category=${category.toLowerCase()}`;
        const res = await fetch(`${API}/api/recommendations${queryParam}`);
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setItems(data.map((d, i) => ({
            id: d.id || `api-${i}`,
            name: d.name || d.title,
            description: d.description || '',
            price: d.price ? (typeof d.price === 'number' ? `$${d.price.toFixed(2)}` : d.price) : '',
            zone: d.zone || d.location || '',
            rating: d.rating ?? 4.0,
            category: d.category || category,
            emoji: d.emoji || (d.category === 'Food' ? '🍽️' : d.category === 'Merchandise' ? '🛍️' : d.category === 'Parking' ? '🅿️' : '⭐'),
          })));
        } else {
          /* Use fallback filtered by category */
          setItems(category === 'All' ? fallbackItems : fallbackItems.filter((it) => it.category === category));
        }
      } catch {
        setItems(category === 'All' ? fallbackItems : fallbackItems.filter((it) => it.category === category));
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [category]);

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.description.toLowerCase().includes(search.toLowerCase())
  );

  const renderStars = (rating) => {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    return (
      <div style={styles.stars}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={11}
            fill={i < full ? 'var(--accent-gold)' : i === full && half ? 'var(--accent-gold)' : 'none'}
            stroke="var(--accent-gold)"
            strokeWidth={i < full || (i === full && half) ? 0 : 1.5}
            opacity={i < full || (i === full && half) ? 1 : 0.3}
          />
        ))}
        <span style={{ marginLeft: 3, fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  return (
    <motion.div className="page" variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <div style={styles.header}>
        <h1 style={styles.title} id="explore-title">Explore</h1>
      </div>

      {/* Search */}
      <div style={styles.searchWrap}>
        <div style={styles.searchIcon}><Search size={18} /></div>
        <input
          className="input input--search"
          placeholder="Search food, merch, parking…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          id="explore-search-input"
        />
      </div>

      {/* Category Tabs */}
      <div style={styles.tabs} id="explore-category-tabs">
        {categories.map((cat) => (
          <button
            key={cat}
            id={`explore-tab-${cat.toLowerCase()}`}
            style={{
              ...styles.tab,
              ...(category === cat ? styles.tabActive : {}),
            }}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div style={styles.grid}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={`skel-${i}`}
              style={{
                ...styles.card,
                height: 180,
                background: 'linear-gradient(90deg, var(--glass-bg) 25%, rgba(255,255,255,0.08) 50%, var(--glass-bg) 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s ease-in-out infinite',
              }}
            />
          ))
        ) : filtered.length === 0 ? (
          <div style={styles.empty}>No items found</div>
        ) : (
          filtered.map((item, i) => (
            <motion.div
              key={item.id}
              custom={i}
              variants={cardVariants}
              initial="initial"
              animate="animate"
              style={styles.card}
              id={`explore-card-${item.id}`}
              onClick={() => setSelectedItem(item)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.03)';
                e.currentTarget.style.boxShadow = '0 12px 36px rgba(0,0,0,0.35)';
                e.currentTarget.style.background = 'var(--bg-card-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.background = 'var(--glass-bg)';
              }}
            >
              <div style={styles.emoji}>{item.emoji}</div>
              <div style={styles.cardName}>{item.name}</div>
              <div style={styles.cardDesc}>{item.description}</div>
              <div style={styles.cardPrice}>{item.price}</div>
              <div style={styles.cardMeta}>
                {renderStars(item.rating)}
                {item.zone && (
                  <span style={styles.zone}>
                    <MapPin size={8} /> {item.zone}
                  </span>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

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
            <ShoppingBag size={16} />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Item Detail Drawer */}
      <AnimatePresence>
        {selectedItem && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: '#0a0e27', zIndex: 1000
              }}
            />
            {/* Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'fixed', bottom: 0, left: 0, right: 0,
                background: 'linear-gradient(180deg, #181d4b 0%, #0d102d 100%)',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                borderTopLeftRadius: 24, borderTopRightRadius: 24,
                padding: '24px 20px 34px', zIndex: 1010,
                boxShadow: '0 -10px 40px rgba(0,0,0,0.5)'
              }}
            >
              {/* Drag Handle */}
              <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, margin: '0 auto 20px' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: 8 }}>{selectedItem.emoji}</span>
                  <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                    {selectedItem.name}
                  </h2>
                  <span style={{ ...styles.zone, marginTop: 6 }}>
                    <MapPin size={8} /> {selectedItem.zone}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  style={{
                    background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '50%',
                    width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', cursor: 'pointer'
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: 20 }}>
                {selectedItem.description || 'No description available.'}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Price</span>
                  <span style={{ ...styles.cardPrice, fontSize: '1.5rem' }}>{selectedItem.price}</span>
                </div>
                {renderStars(selectedItem.rating)}
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => {
                    setSelectedItem(null);
                    let destinationId = 'sec-103';
                    const zoneLower = selectedItem.zone.toLowerCase();
                    if (zoneLower.includes('103')) destinationId = 'sec-103';
                    else if (zoneLower.includes('101')) destinationId = 'sec-101';
                    else if (zoneLower.includes('105')) destinationId = 'sec-105';
                    else if (zoneLower.includes('107')) destinationId = 'sec-107';
                    else if (zoneLower.includes('north lot') || zoneLower.includes('gate a')) destinationId = 'gate-north';
                    else if (zoneLower.includes('gate b')) destinationId = 'gate-east';
                    else if (zoneLower.includes('gate c')) destinationId = 'gate-south';
                    else if (zoneLower.includes('vip')) destinationId = 'vip-lounge';
                    else if (zoneLower.includes('medical')) destinationId = 'medical';
                    navigate('/navigate', { state: { destination: destinationId } });
                  }}
                  style={{
                    flex: 1, padding: '12px 16px', background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 12,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    fontWeight: 600, fontSize: '0.875rem'
                  }}
                >
                  <MapPin size={16} /> Show on Map
                </button>
                <button
                  onClick={() => {
                    setToastMessage(`Ordered ${selectedItem.name}!`);
                    setShowToast(true);
                    setSelectedItem(null);
                    setTimeout(() => setShowToast(false), 3000);
                  }}
                  style={{
                    flex: 1, padding: '12px 16px', background: 'var(--gradient-primary)',
                    border: 'none', color: '#fff', borderRadius: 12,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    fontWeight: 600, fontSize: '0.875rem', boxShadow: '0 4px 14px rgba(59,130,246,0.4)'
                  }}
                >
                  <ShoppingBag size={16} /> Order Now
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

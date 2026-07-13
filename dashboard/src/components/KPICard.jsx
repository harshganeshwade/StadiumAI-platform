import React, { useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function KPICard({ title, value, icon: Icon, trend, trendDirection, color, subtitle, id }) {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValue = useRef(0);
  const animRef = useRef(null);

  useEffect(() => {
    const numericVal = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0;
    const startVal = prevValue.current;
    const diff = numericVal - startVal;
    const duration = 800;
    const startTime = performance.now();

    if (animRef.current) cancelAnimationFrame(animRef.current);

    function animate(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startVal + diff * eased;
      setDisplayValue(current);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        prevValue.current = numericVal;
      }
    }

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [value]);

  const colorMap = {
    blue: { glow: 'glow-blue', icon: 'blue', accent: '#3b82f6' },
    red: { glow: 'glow-red', icon: 'red', accent: '#ef4444' },
    green: { glow: 'glow-green', icon: 'green', accent: '#22c55e' },
    amber: { glow: 'glow-amber', icon: 'amber', accent: '#f59e0b' },
    purple: { glow: 'glow-purple', icon: 'purple', accent: '#a855f7' },
    cyan: { glow: 'glow-cyan', icon: 'cyan', accent: '#06b6d4' },
  };

  const c = colorMap[color] || colorMap.blue;
  const isPercentage = typeof value === 'string' && value.includes('%');
  const suffix = isPercentage ? '%' : '';

  const formatDisplay = () => {
    if (isPercentage) {
      return displayValue.toFixed(1) + suffix;
    }
    return Math.round(displayValue).toLocaleString();
  };

  return (
    <div className={`kpi-card ${c.glow}`} id={id}>
      <div className="kpi-glow-accent" style={{ background: c.accent }} />
      <div className="kpi-header">
        <span className="kpi-title">{title}</span>
        <div className={`kpi-icon ${c.icon}`}>
          {Icon && <Icon />}
        </div>
      </div>
      <div className="kpi-value">{formatDisplay()}</div>
      <div className="kpi-footer">
        {trend && (
          <span className={`kpi-trend ${trendDirection || 'up'}`}>
            {trendDirection === 'down' ? <TrendingDown size={13} /> : <TrendingUp size={13} />}
            {trend}
          </span>
        )}
        {subtitle && <span className="kpi-subtitle">{subtitle}</span>}
      </div>
    </div>
  );
}

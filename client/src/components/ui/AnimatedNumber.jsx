import React, { useState, useEffect } from 'react';

/**
 * AnimatedNumber component that animates numbers on mount using requestAnimationFrame
 * Supports pure numbers, numbers with units (e.g. "14%"), or fractions (e.g. "74 / 74").
 */
export function AnimatedNumber({ value, duration = 800, className }) {
  // If in test environment or invalid value, render directly without delay
  const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
  const [progress, setProgress] = useState(isTest ? 1 : 0);

  useEffect(() => {
    if (isTest) return;

    let startTimestamp = null;
    let animId = null;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const p = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - p, 3);
      setProgress(eased);

      if (p < 1) {
        animId = window.requestAnimationFrame(step);
      } else {
        setProgress(1);
      }
    };

    animId = window.requestAnimationFrame(step);
    return () => {
      if (animId) window.cancelAnimationFrame(animId);
    };
  }, [value, duration, isTest]);

  if (value === null || value === undefined) {
    return <span className={className}>—</span>;
  }

  const str = String(value);

  // Case 1: Fraction like "74 / 74" or "38 / 74"
  if (str.includes('/')) {
    const parts = str.split('/');
    const n1 = parseFloat(parts[0].trim()) || 0;
    const n2 = parseFloat(parts[1].trim()) || 0;
    const cur1 = Math.round(n1 * progress);
    const cur2 = Math.round(n2 * progress);
    return (
      <span className={className}>
        {cur1} / {cur2}
      </span>
    );
  }

  // Case 2: Percentage like "14%" or "86.5%"
  if (str.endsWith('%')) {
    const num = parseFloat(str.replace('%', '').trim()) || 0;
    const current = (num * progress).toFixed(str.includes('.') ? 1 : 0);
    return <span className={className}>{current}%</span>;
  }

  // Case 3: Pure number or decimal
  const num = parseFloat(str);
  if (!isNaN(num)) {
    const isDecimal = str.includes('.');
    const decimals = isDecimal ? str.split('.')[1].length : 0;
    const current = (num * progress).toFixed(decimals);
    return <span className={className}>{current}</span>;
  }

  // Fallback for non-numeric string
  return <span className={className}>{str}</span>;
}

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../components/ui/StatusBadge.jsx';
import { StreakDots } from '../components/ui/StreakDots.jsx';
import { MetricCard } from '../components/ui/MetricCard.jsx';
import { AlertBanner } from '../components/ui/AlertBanner.jsx';

describe('UI Component Library', () => {
  it('renders StatusBadge with label and custom variant', () => {
    const { container } = render(<StatusBadge variant="fever" label="Fever (38.4 °C)" />);
    expect(screen.getByText('Fever (38.4 °C)')).toBeDefined();
    expect(container.firstChild.className).toContain('bg-fever-soft');
  });

  it('renders StreakDots with correct number of total and active dots', () => {
    const { container } = render(<StreakDots current={2} target={3} showText={true} />);
    // 2 active dots have bg-emerald-600
    const activeDots = container.querySelectorAll('.bg-emerald-600');
    expect(activeDots.length).toBe(2);
    expect(screen.getByText('2/3')).toBeDefined();
  });

  it('renders MetricCard with title, value, unit, and badge', () => {
    render(
      <MetricCard
        title="Quarantine Capacity"
        value="74"
        unit="74/74"
        badgeText="100% Full"
        badgeVariant="warning"
        subtext="All beds occupied"
      />
    );

    expect(screen.getByText('Quarantine Capacity')).toBeDefined();
    expect(screen.getByText('74')).toBeDefined();
    expect(screen.getByText('74/74')).toBeDefined();
    expect(screen.getByText('100% Full')).toBeDefined();
    expect(screen.getByText('All beds occupied')).toBeDefined();
  });

  it('renders AlertBanner when mortality is in warning state', () => {
    render(
      <AlertBanner
        mortality={{
          state: 'WARNING',
          rateFormatted: '14.0%',
          ratePercent: 14.0,
          deceased: 7,
          closed: 50,
          benchmarkPercent: 15,
        }}
      />
    );

    expect(screen.getByText(/QUALITY WARNING/i)).toBeDefined();
    expect(screen.getByText(/14.0%/i)).toBeDefined();
    expect(screen.getByText(/Benchmark: 15%/i)).toBeDefined();
  });

  it('does not render AlertBanner when mortality is NORMAL', () => {
    const { container } = render(
      <AlertBanner
        mortality={{
          state: 'NORMAL',
          ratePercent: 8.0,
          deceased: 2,
          closed: 25,
          benchmarkPercent: 15,
        }}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});

import { describe, it, expect } from '@jest/globals';
import {
  canTransition,
  assertTransition,
  getValidTransitions,
  getAutoTransition,
  type EventStatus,
} from '@/lib/events/stateMachine';

// ─── canTransition ────────────────────────────────────────────────────────────
describe('canTransition', () => {
  it('draft → published is allowed', () => {
    expect(canTransition('draft', 'published')).toBe(true);
  });

  it('draft → cancelled is allowed', () => {
    expect(canTransition('draft', 'cancelled')).toBe(true);
  });

  it('draft → ongoing is NOT allowed', () => {
    expect(canTransition('draft', 'ongoing')).toBe(false);
  });

  it('draft → completed is NOT allowed', () => {
    expect(canTransition('draft', 'completed')).toBe(false);
  });

  it('published → ongoing is allowed', () => {
    expect(canTransition('published', 'ongoing')).toBe(true);
  });

  it('published → cancelled is allowed', () => {
    expect(canTransition('published', 'cancelled')).toBe(true);
  });

  it('published → draft is NOT allowed (no going back)', () => {
    expect(canTransition('published', 'draft')).toBe(false);
  });

  it('ongoing → completed is allowed', () => {
    expect(canTransition('ongoing', 'completed')).toBe(true);
  });

  it('ongoing → cancelled is allowed', () => {
    expect(canTransition('ongoing', 'cancelled')).toBe(true);
  });

  it('completed → anything is NOT allowed (terminal)', () => {
    const terminal: EventStatus[] = ['draft', 'published', 'ongoing', 'cancelled'];
    for (const to of terminal) {
      expect(canTransition('completed', to)).toBe(false);
    }
  });

  it('cancelled → anything is NOT allowed (terminal)', () => {
    const terminal: EventStatus[] = ['draft', 'published', 'ongoing', 'completed'];
    for (const to of terminal) {
      expect(canTransition('cancelled', to)).toBe(false);
    }
  });
});

// ─── assertTransition ─────────────────────────────────────────────────────────
describe('assertTransition', () => {
  it('does not throw on valid transitions', () => {
    expect(() => assertTransition('draft', 'published')).not.toThrow();
    expect(() => assertTransition('published', 'ongoing')).not.toThrow();
    expect(() => assertTransition('ongoing', 'completed')).not.toThrow();
  });

  it('throws a descriptive Error on invalid transition', () => {
    expect(() => assertTransition('completed', 'draft')).toThrow(/completed.*draft/i);
    expect(() => assertTransition('draft', 'completed')).toThrow();
  });

  it('error message includes both states', () => {
    try {
      assertTransition('cancelled', 'ongoing');
    } catch (err) {
      expect((err as Error).message).toMatch('cancelled');
      expect((err as Error).message).toMatch('ongoing');
    }
  });
});

// ─── getValidTransitions ──────────────────────────────────────────────────────
describe('getValidTransitions', () => {
  it('returns 2 transitions for draft', () => {
    const t = getValidTransitions('draft');
    expect(t).toHaveLength(2);
    const tos = t.map((x) => x.to);
    expect(tos).toContain('published');
    expect(tos).toContain('cancelled');
  });

  it('returns empty array for completed (terminal)', () => {
    expect(getValidTransitions('completed')).toHaveLength(0);
  });

  it('returns empty array for cancelled (terminal)', () => {
    expect(getValidTransitions('cancelled')).toHaveLength(0);
  });
});

// ─── getAutoTransition ────────────────────────────────────────────────────────
describe('getAutoTransition', () => {
  const PAST   = new Date(Date.now() - 2 * 24 * 3600 * 1000);  // 2 days ago
  const TODAY  = new Date();
  const FUTURE = new Date(Date.now() + 7 * 24 * 3600 * 1000);  // 7 days ahead

  it('transitions published → ongoing when event date has passed', () => {
    expect(getAutoTransition('published', PAST)).toBe('ongoing');
  });

  it('transitions ongoing → completed the day after the event', () => {
    // PAST is 2 days ago, so "day after" is 1 day ago → completed
    expect(getAutoTransition('ongoing', PAST)).toBe('completed');
  });

  it('does not auto-transition published if event is in the future', () => {
    expect(getAutoTransition('published', FUTURE)).toBeNull();
  });

  it('does not auto-transition draft, completed, or cancelled', () => {
    expect(getAutoTransition('draft', PAST)).toBeNull();
    expect(getAutoTransition('completed', PAST)).toBeNull();
    expect(getAutoTransition('cancelled', PAST)).toBeNull();
  });
});

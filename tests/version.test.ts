import { describe, it, expect } from 'vitest';
import { formatDate } from '../src/version.js';

describe('formatDate', () => {
    it('formats current date as YYYY-MM-DD', () => {
        const result = formatDate();
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('returns a date string from a given Date object', () => {
        const result = formatDate(new Date('2025-12-25T12:00:00Z'));
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(result).toContain('2025-12');
    });
});

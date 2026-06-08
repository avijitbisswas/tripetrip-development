import { describe, expect, it } from 'vitest';
import { buildVendorAIBriefPrompt, normalizeVendorAIBrief } from './aiProvider';

describe('Vendor OS AI provider helpers', () => {
  it('builds an operations prompt from tenant context and signals', () => {
    const prompt = buildVendorAIBriefPrompt({
      organizationName: 'Himalayan Escape Group',
      branchName: 'Manali Hotel',
      signals: ['14 arrivals today', '6 dirty rooms', '3 high-value leads'],
    });

    expect(prompt).toContain('Himalayan Escape Group');
    expect(prompt).toContain('Manali Hotel');
    expect(prompt).toContain('14 arrivals today');
    expect(prompt).toContain('Return strict JSON');
  });

  it('normalizes provider output into an auditable insight payload', () => {
    const insight = normalizeVendorAIBrief(
      JSON.stringify({
        title: 'Morning risk brief',
        recommendation: 'Prioritize housekeeping before 2 PM arrivals.',
        confidence: 82,
        status: 'review',
      }),
    );

    expect(insight).toEqual({
      title: 'Morning risk brief',
      recommendation: 'Prioritize housekeeping before 2 PM arrivals.',
      confidence: 82,
      status: 'review',
    });
  });

  it('falls back safely when provider output is not JSON', () => {
    const insight = normalizeVendorAIBrief('Check room readiness and permit risks before publishing direct deals.');

    expect(insight.title).toBe('AI operations brief');
    expect(insight.recommendation).toBe('Check room readiness and permit risks before publishing direct deals.');
    expect(insight.confidence).toBe(60);
    expect(insight.status).toBe('review');
  });
});

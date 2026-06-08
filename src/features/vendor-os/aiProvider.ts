export type VendorAIBriefInput = {
  organizationName?: string | null;
  branchName?: string | null;
  signals?: string[];
};

export type VendorAIBriefInsight = {
  title: string;
  recommendation: string;
  confidence: number;
  status: 'review' | 'ready' | 'approved' | 'dismissed';
};

const VALID_STATUSES = ['review', 'ready', 'approved', 'dismissed'] as const;

function clampConfidence(value: unknown) {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return 60;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function normalizeStatus(value: unknown): VendorAIBriefInsight['status'] {
  return VALID_STATUSES.includes(value as VendorAIBriefInsight['status'])
    ? (value as VendorAIBriefInsight['status'])
    : 'review';
}

function stripJsonFence(text: string) {
  return text
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
}

export function buildVendorAIBriefPrompt(input: VendorAIBriefInput) {
  const organization = input.organizationName || 'Tripetrip vendor organization';
  const branch = input.branchName || 'All active branches';
  const signals = input.signals?.length ? input.signals : ['No live signals were provided. Generate a cautious operations review.'];

  return [
    'You are Tripetrip AI Operations Assistant for a multi-category travel vendor.',
    `Organization: ${organization}`,
    `Branch: ${branch}`,
    'Signals:',
    ...signals.map((signal) => `- ${signal}`),
    'Return strict JSON with exactly these fields: title, recommendation, confidence, status.',
    'Keep status one of: review, ready.',
    'Keep confidence as a number from 0 to 100.',
    'Do not include markdown.',
  ].join('\n');
}

export function normalizeVendorAIBrief(providerText: string): VendorAIBriefInsight {
  const fallbackRecommendation = providerText.trim() || 'Review live operations before taking action.';

  try {
    const parsed = JSON.parse(stripJsonFence(providerText)) as Record<string, unknown>;
    return {
      title: String(parsed.title || 'AI operations brief'),
      recommendation: String(parsed.recommendation || fallbackRecommendation),
      confidence: clampConfidence(parsed.confidence),
      status: normalizeStatus(parsed.status),
    };
  } catch {
    return {
      title: 'AI operations brief',
      recommendation: fallbackRecommendation,
      confidence: 60,
      status: 'review',
    };
  }
}

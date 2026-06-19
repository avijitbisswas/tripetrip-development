export interface MapSuggestion {
  id: string;
  label: string;
  secondary?: string;
}

export async function suggestLocations(query: string) {
  const response = await fetch(`/api/maps/suggest?q=${encodeURIComponent(query)}`);
  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
    suggestions?: MapSuggestion[];
  };

  if (!response.ok) {
    throw new Error(payload.error || 'Unable to load map suggestions');
  }

  return payload.suggestions || [];
}

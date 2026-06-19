import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { LocationAutosuggest } from '@/src/components/maps/LocationAutosuggest';

function Harness({ onSelect }: { onSelect: (value: { id: string; label: string; secondary?: string }) => void }) {
  const [value, setValue] = useState('');
  return (
    <LocationAutosuggest
      label="Pick-up Location"
      placeholder="Search pickup"
      value={value}
      onChange={setValue}
      onSelect={onSelect}
    />
  );
}

describe('LocationAutosuggest', () => {
  it('loads suggestions and lets the user select one', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          suggestions: [
            { id: 'goa-1', label: 'Goa Airport, Goa, India', secondary: 'Airport' },
            { id: 'goa-2', label: 'Goa, India', secondary: 'State' },
          ],
        }),
        { headers: { 'Content-Type': 'application/json' } },
      ),
    );
    const onSelect = vi.fn();
    const user = userEvent.setup();

    try {
      render(<Harness onSelect={onSelect} />);

      await user.type(screen.getByLabelText(/Pick-up Location/i), 'Goa');

      await waitFor(() =>
        expect(fetchMock).toHaveBeenCalledWith('/api/maps/suggest?q=Goa'),
      );
      await user.click(await screen.findByRole('button', { name: /Goa Airport, Goa, India/i }));

      expect(onSelect).toHaveBeenCalledWith({
        id: 'goa-1',
        label: 'Goa Airport, Goa, India',
        secondary: 'Airport',
      });
    } finally {
      fetchMock.mockRestore();
    }
  });
});

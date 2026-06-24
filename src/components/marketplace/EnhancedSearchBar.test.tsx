import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import EnhancedSearchBar from './EnhancedSearchBar';

function renderSearchBar() {
  return render(
    <MemoryRouter>
      <EnhancedSearchBar />
    </MemoryRouter>,
  );
}

describe('EnhancedSearchBar', () => {
  it('changes fields when the active travel type changes', async () => {
    const user = userEvent.setup();
    renderSearchBar();

    expect(screen.getByText('Check-In')).toBeInTheDocument();
    expect(screen.getByText('Check-Out')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^Activities$/i }));

    expect(screen.getByText('Activity Date')).toBeInTheDocument();
    expect(screen.getByText('Activity Type')).toBeInTheDocument();
    expect(screen.queryByText('Check-In')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^Transport$/i }));

    expect(screen.getByText('Pickup')).toBeInTheDocument();
    expect(screen.getByText('Drop')).toBeInTheDocument();
    expect(screen.getByText('Vehicle')).toBeInTheDocument();
    expect(screen.queryByText('Activity Date')).not.toBeInTheDocument();
  });

  it('shows map suggestions while typing a destination', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          suggestions: [
            { id: 'del-1', label: 'Delhi, India', secondary: 'city' },
            { id: 'del-2', label: 'Delhi Airport, India', secondary: 'aerodrome' },
          ],
        }),
        { headers: { 'Content-Type': 'application/json' } },
      ),
    );
    const user = userEvent.setup();

    try {
      renderSearchBar();

      await user.type(screen.getByPlaceholderText(/Search destinations/i), 'del');

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('/api/maps/suggest?q=del');
      });
      expect(await screen.findByRole('button', { name: /Delhi, India city/i })).toBeInTheDocument();
    } finally {
      fetchMock.mockRestore();
    }
  });
});

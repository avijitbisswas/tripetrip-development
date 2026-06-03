import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Layout from '@/src/components/Layout';

function renderLayoutAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<Layout session={null} />}>
          <Route path="/deals" element={<div>Deals page</div>} />
          <Route path="/more" element={<div>More page</div>} />
          <Route path="/packages" element={<div>Packages page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('Layout navigation', () => {
  it('shows Deals and More in the primary navigation', () => {
    renderLayoutAt('/deals');

    expect(screen.getByRole('link', { name: /^Deals$/i })).toHaveAttribute('href', '/deals');
    expect(screen.getByRole('link', { name: /^More$/i })).toHaveAttribute('href', '/search');
  });

  it('marks Deals active for the deals navigation page', () => {
    renderLayoutAt('/deals');

    expect(screen.getByRole('link', { name: /^Deals$/i })).toHaveClass('text-[#16A34A]');
    expect(screen.getByRole('link', { name: /^Packages$/i })).not.toHaveClass('text-[#16A34A]');
  });

  it('marks Packages active only on the packages page', () => {
    renderLayoutAt('/packages');

    expect(screen.getByRole('link', { name: /^Packages$/i })).toHaveClass('text-[#16A34A]');
    expect(screen.getByRole('link', { name: /^Deals$/i })).not.toHaveClass('text-[#16A34A]');
  });
});

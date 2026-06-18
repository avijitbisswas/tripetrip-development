import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Community from '@/src/pages/Community';
import { listCommunityPosts } from '@/src/services/community';

vi.mock('@/src/services/community', () => ({
  createCommunityPost: vi.fn(),
  getCommunityProfile: vi.fn(),
  listCommunityPosts: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    message: vi.fn(),
  },
}));

const viewer = {
  id: 'traveler-1',
  fullName: 'Traveler Tester',
  role: 'traveler' as const,
  avatarUrl: null,
};

function renderCommunity() {
  return render(
    <MemoryRouter initialEntries={['/community']}>
      <Routes>
        <Route path="/community" element={<Community />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Community composer', () => {
  beforeEach(() => {
    vi.mocked(listCommunityPosts).mockResolvedValue({
      viewer,
      posts: [],
    });
  });

  it('renders a Twitter-style composer with audience and attachment controls', async () => {
    const user = userEvent.setup();
    renderCommunity();

    const composer = await screen.findByPlaceholderText("What's happening?");

    expect(screen.getByText(/Everyone can reply/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add image/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add GIF/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Change reply audience/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Limit visibility/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add poll/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add emoji/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Schedule post/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add location/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mark important/i })).toBeInTheDocument();

    const postButton = screen.getByRole('button', { name: /^Post$/i });
    expect(postButton).toBeDisabled();

    await user.type(composer, 'Testing the community feed');

    expect(postButton).toBeEnabled();
  });
});

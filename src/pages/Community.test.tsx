import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Community from '@/src/pages/Community';
import { createCommunityPost, listCommunityPosts } from '@/src/services/community';
import { uploadImageToCloudinary } from '@/src/services/media';

vi.mock('@/src/services/community', () => ({
  createCommunityPost: vi.fn(),
  getCommunityProfile: vi.fn(),
  listCommunityPosts: vi.fn(),
}));

vi.mock('@/src/services/media', () => ({
  uploadImageToCloudinary: vi.fn(),
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
    vi.mocked(createCommunityPost).mockReset();
    vi.mocked(uploadImageToCloudinary).mockReset();
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

  it('builds a structured post with image upload, poll, location, schedule, and flags', async () => {
    const user = userEvent.setup();
    vi.mocked(uploadImageToCloudinary).mockResolvedValue('https://cdn.example.com/community-photo.jpg');
    vi.mocked(createCommunityPost).mockResolvedValue({
      post: {
        id: 'post-99',
        authorId: viewer.id,
        role: viewer.role,
        content: 'Roadtrip update',
        createdAt: '2026-06-19T08:00:00.000Z',
        audience: 'circle',
        visibility: 'profile',
        location: 'Munnar, Kerala',
        scheduledAt: '2026-06-20T10:30',
        important: true,
        media: {
          type: 'image',
          url: 'https://cdn.example.com/community-photo.jpg',
        },
        poll: {
          options: ['Tea estates', 'Waterfalls'],
        },
        author: viewer,
      },
    });

    renderCommunity();

    await user.type(await screen.findByPlaceholderText("What's happening?"), 'Roadtrip update');
    await user.click(screen.getByRole('button', { name: /Change reply audience/i }));
    await user.click(screen.getByRole('button', { name: /Limit visibility/i }));
    await user.click(screen.getByRole('button', { name: /Add location/i }));
    await user.type(screen.getByLabelText(/Post location/i), 'Munnar, Kerala');
    await user.click(screen.getByRole('button', { name: /Add poll/i }));
    await user.type(screen.getByLabelText(/Poll option 1/i), 'Tea estates');
    await user.type(screen.getByLabelText(/Poll option 2/i), 'Waterfalls');
    await user.click(screen.getByRole('button', { name: /Schedule post/i }));
    await user.type(screen.getByLabelText(/Schedule date and time/i), '2026-06-20T10:30');
    await user.click(screen.getByRole('button', { name: /Mark important/i }));

    const fileInput = screen.getByLabelText(/Upload image/i);
    await user.upload(fileInput, new File(['image'], 'trip.png', { type: 'image/png' }));

    expect(await screen.findByAltText(/Community attachment preview/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^Post$/i }));

    expect(uploadImageToCloudinary).toHaveBeenCalled();
    expect(createCommunityPost).toHaveBeenCalledWith({
      content: 'Roadtrip update',
      audience: 'circle',
      visibility: 'profile',
      location: 'Munnar, Kerala',
      scheduledAt: '2026-06-20T10:30',
      important: true,
      media: {
        type: 'image',
        url: 'https://cdn.example.com/community-photo.jpg',
        alt: 'Community attachment preview',
      },
      poll: {
        options: ['Tea estates', 'Waterfalls'],
      },
    });
  });
});

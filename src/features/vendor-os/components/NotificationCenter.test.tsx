import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NotificationCenter } from './NotificationCenter';

describe('NotificationCenter', () => {
  it('marks unread notifications as read from the center', async () => {
    const markAsRead = vi.fn().mockResolvedValue(undefined);

    render(
      <NotificationCenter
        markAsRead={markAsRead}
        notifications={[
          {
            id: 'note-1',
            title: 'New booking',
            status: 'unread',
          },
          {
            id: 'note-2',
            title: 'Invoice paid',
            status: 'read',
          },
        ]}
        unreadCount={1}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Mark New booking as read' }));

    expect(markAsRead).toHaveBeenCalledWith('note-1');
    expect(screen.queryByRole('button', { name: 'Mark Invoice paid as read' })).not.toBeInTheDocument();
  });
});

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProfileModal } from '../ProfileModal';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

jest.mock('@/lib/supabase/client');
jest.mock('next/navigation');

describe('ProfileModal', () => {
  const mockOnClose = jest.fn();
  const mockPush = jest.fn();
  const mockRefresh = jest.fn();
  const mockSignOut = jest.fn();

  const mockUser = {
    email: 'test@example.com',
    username: 'testuser',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });
    (createClient as jest.Mock).mockReturnValue({
      auth: {
        signOut: mockSignOut,
      },
    });
  });

  it('does not render when isOpen is false', () => {
    render(
      <ProfileModal
        isOpen={false}
        onClose={mockOnClose}
        user={mockUser}
      />
    );

    expect(screen.queryByText(/profile/i)).not.toBeInTheDocument();
  });

  it('renders when isOpen is true', () => {
    render(
      <ProfileModal
        isOpen={true}
        onClose={mockOnClose}
        user={mockUser}
      />
    );

    expect(screen.getByText(/profile/i)).toBeInTheDocument();
  });

  it('displays user email', () => {
    render(
      <ProfileModal
        isOpen={true}
        onClose={mockOnClose}
        user={mockUser}
      />
    );

    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('displays username when provided', () => {
    render(
      <ProfileModal
        isOpen={true}
        onClose={mockOnClose}
        user={mockUser}
      />
    );

    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  it('displays email as fallback when no username', () => {
    const userWithoutUsername = {
      email: 'test@example.com',
    };

    render(
      <ProfileModal
        isOpen={true}
        onClose={mockOnClose}
        user={userWithoutUsername}
      />
    );

    // Should display email in the username position
    const emailElements = screen.getAllByText('test@example.com');
    expect(emailElements.length).toBeGreaterThan(0);
  });

  it('calls onClose when backdrop is clicked', () => {
    render(
      <ProfileModal
        isOpen={true}
        onClose={mockOnClose}
        user={mockUser}
      />
    );

    const backdrop = screen.getByRole('button', { name: /close modal/i }).parentElement?.parentElement;
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <ProfileModal
        isOpen={true}
        onClose={mockOnClose}
        user={mockUser}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close modal/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('renders Logout button', () => {
    render(
      <ProfileModal
        isOpen={true}
        onClose={mockOnClose}
        user={mockUser}
      />
    );

    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  it('logs out user when Logout is clicked', async () => {
    mockSignOut.mockResolvedValue({ error: null });

    render(
      <ProfileModal
        isOpen={true}
        onClose={mockOnClose}
        user={mockUser}
      />
    );

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/login');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('displays user avatar with initial', () => {
    render(
      <ProfileModal
        isOpen={true}
        onClose={mockOnClose}
        user={mockUser}
      />
    );

    expect(screen.getByText('T')).toBeInTheDocument(); // First letter of username
  });

  it('has fade-in animation', () => {
    const { container } = render(
      <ProfileModal
        isOpen={true}
        onClose={mockOnClose}
        user={mockUser}
      />
    );

    const backdrop = container.querySelector('.animate-fadeIn');
    expect(backdrop).toBeInTheDocument();
  });

  it('prevents backdrop click from closing when clicking modal content', () => {
    render(
      <ProfileModal
        isOpen={true}
        onClose={mockOnClose}
        user={mockUser}
      />
    );

    const modalContent = screen.getByText(/profile/i).parentElement;
    if (modalContent) {
      fireEvent.click(modalContent);
      expect(mockOnClose).not.toHaveBeenCalled();
    }
  });

  it('renders with proper z-index for overlay', () => {
    const { container } = render(
      <ProfileModal
        isOpen={true}
        onClose={mockOnClose}
        user={mockUser}
      />
    );

    const overlay = container.querySelector('.z-50');
    expect(overlay).toBeInTheDocument();
  });
});

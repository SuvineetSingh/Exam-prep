import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../Header';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/dashboard',
}));
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signOut: jest.fn().mockResolvedValue({}) },
  }),
}));
jest.mock('@/hooks/useUserActivity', () => ({
  useUserActivity: jest.fn(),
}));

describe('Header', () => {
  const mockUser = {
    id: '123',
    email: 'test@example.com',
    user_metadata: { username: 'testuser' },
    app_metadata: {},
    aud: 'authenticated',
    created_at: '',
  } as any;

  it('renders the header with logo and title', () => {
    render(<Header user={mockUser} />);

    expect(screen.getByText('Exam Prep Platform')).toBeInTheDocument();
    expect(screen.getByText('EPP')).toBeInTheDocument();
  });

  it('renders logo link to homepage', () => {
    render(<Header user={mockUser} />);

    const logoLink = screen.getByRole('link', { name: /exam prep platform/i });
    expect(logoLink).toHaveAttribute('href', '/');
  });

  it('renders profile dropdown button with email initial', () => {
    render(<Header user={mockUser} />);

    // ProfileDropdown renders in both desktop and mobile — expect at least one
    const initials = screen.getAllByText('T');
    expect(initials.length).toBeGreaterThan(0); // First letter of "test@example.com"
  });

  it('renders profile button with email initial when no username', () => {
    const userWithoutUsername = {
      id: '456',
      email: 'user@example.com',
      user_metadata: {},
      app_metadata: {},
      aud: 'authenticated',
      created_at: '',
    } as any;
    render(<Header user={userWithoutUsername} />);

    const initials = screen.getAllByText('U');
    expect(initials.length).toBeGreaterThan(0); // First letter of "user@example.com"
  });

  it('opens profile dropdown when profile button is clicked', () => {
    render(<Header user={mockUser} />);

    const profileButtons = screen.getAllByRole('button', { name: 'T Online' });
    fireEvent.click(profileButtons[0]!);

    // Multiple "Exam History" links exist (dropdown + mobile drawer) — just check at least one
    expect(screen.getAllByText('Exam History').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Logout').length).toBeGreaterThan(0);
  });

  it('has fixed positioning at top', () => {
    const { container } = render(<Header user={mockUser} />);

    const header = container.querySelector('header');
    expect(header).toHaveClass('fixed', 'top-0', 'left-0', 'right-0');
  });

  it('has proper z-index for overlay', () => {
    const { container } = render(<Header user={mockUser} />);

    const header = container.querySelector('header');
    expect(header).toHaveClass('z-40');
  });

  it('displays full title on desktop and abbreviated on mobile', () => {
    render(<Header user={mockUser} />);

    const fullTitle = screen.getByText('Exam Prep Platform');
    const abbrevTitle = screen.getByText('EPP');

    expect(fullTitle).toHaveClass('hidden', 'sm:block');
    expect(abbrevTitle).toHaveClass('sm:hidden');
  });

  it('renders with border at bottom', () => {
    const { container } = render(<Header user={mockUser} />);

    const header = container.querySelector('header');
    expect(header).toHaveClass('border-b', 'border-gray-200');
  });

  it('renders SVG icon in logo', () => {
    const { container } = render(<Header user={mockUser} />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('text-white');
  });
});

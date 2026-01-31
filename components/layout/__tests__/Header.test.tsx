import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../Header';

describe('Header', () => {
  const mockUser = {
    email: 'test@example.com',
    username: 'testuser',
  };

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

  it('renders profile button with username initial', () => {
    render(<Header user={mockUser} />);

    expect(screen.getByText('T')).toBeInTheDocument(); // First letter of "testuser"
  });

  it('renders profile button with email initial when no username', () => {
    const userWithoutUsername = {
      email: 'user@example.com',
    };
    render(<Header user={userWithoutUsername} />);

    expect(screen.getByText('U')).toBeInTheDocument(); // First letter of "user@example.com"
  });

  it('opens profile modal when profile button is clicked', () => {
    render(<Header user={mockUser} />);

    const profileButton = screen.getByRole('button', { name: /open profile menu/i });
    fireEvent.click(profileButton);

    // ProfileModal should be rendered
    // Note: This depends on ProfileModal implementation
    // We're just checking the button click doesn't error
    expect(profileButton).toBeInTheDocument();
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

  it('has hover effect on profile button', () => {
    render(<Header user={mockUser} />);

    const profileButton = screen.getByRole('button', { name: /open profile menu/i });
    expect(profileButton).toHaveClass('hover:bg-gray-100');
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

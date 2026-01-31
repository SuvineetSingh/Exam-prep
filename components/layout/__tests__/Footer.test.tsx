import { render, screen } from '@testing-library/react';
import { Footer } from '../Footer';

describe('Footer', () => {
  it('renders the footer with company branding', () => {
    render(<Footer />);

    expect(screen.getByText('Exam Prep Platform')).toBeInTheDocument();
    expect(screen.getByText(/master your cpa, cfa, and fe exams/i)).toBeInTheDocument();
  });

  it('renders copyright with current year', () => {
    render(<Footer />);

    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`© ${currentYear}`, 'i'))).toBeInTheDocument();
  });

  it('renders Quick Links section', () => {
    render(<Footer />);

    expect(screen.getByText('Quick Links')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^dashboard$/i })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: /^questions$/i })).toHaveAttribute('href', '/questions');
    expect(screen.getByRole('link', { name: /^home$/i })).toHaveAttribute('href', '/');
  });

  it('renders Support section', () => {
    render(<Footer />);

    expect(screen.getByText('Support')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /documentation/i })).toHaveAttribute('href', '/documentation');
    expect(screen.getByRole('link', { name: /contact us/i })).toHaveAttribute('href', 'mailto:support@examprep.com');
    expect(screen.getByRole('link', { name: /privacy policy/i })).toHaveAttribute('href', '/privacy');
    expect(screen.getByRole('link', { name: /terms of service/i })).toHaveAttribute('href', '/terms');
  });

  it('renders social media links', () => {
    render(<Footer />);

    const socialLinks = screen.getAllByRole('link', { name: /twitter|linkedin|github/i });
    expect(socialLinks).toHaveLength(3);

    const twitterLink = screen.getByRole('link', { name: /twitter/i });
    const linkedinLink = screen.getByRole('link', { name: /linkedin/i });
    const githubLink = screen.getByRole('link', { name: /github/i });

    expect(twitterLink).toHaveAttribute('href', 'https://twitter.com');
    expect(linkedinLink).toHaveAttribute('href', 'https://linkedin.com');
    expect(githubLink).toHaveAttribute('href', 'https://github.com');
  });

  it('opens social links in new tab', () => {
    render(<Footer />);

    const socialLinks = screen.getAllByRole('link', { name: /twitter|linkedin|github/i });
    
    socialLinks.forEach(link => {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  it('renders logo SVG', () => {
    const { container } = render(<Footer />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('has responsive grid layout', () => {
    const { container } = render(<Footer />);

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-4');
  });

  it('has top border', () => {
    const { container } = render(<Footer />);

    const footer = container.querySelector('footer');
    expect(footer).toHaveClass('border-t', 'border-gray-200');
  });

  it('has white background', () => {
    const { container } = render(<Footer />);

    const footer = container.querySelector('footer');
    expect(footer).toHaveClass('bg-white');
  });

  it('applies hover effects to links', () => {
    render(<Footer />);

    const dashboardLink = screen.getByRole('link', { name: /^dashboard$/i });
    expect(dashboardLink).toHaveClass('hover:text-primary-600');
  });

  it('renders contact email as mailto link', () => {
    render(<Footer />);

    const contactLink = screen.getByRole('link', { name: /contact us/i });
    expect(contactLink).toHaveAttribute('href', 'mailto:support@examprep.com');
  });
});

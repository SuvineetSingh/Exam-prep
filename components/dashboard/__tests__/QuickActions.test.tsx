import { render, screen } from '@testing-library/react';
import { QuickActions } from '../QuickActions';

describe('QuickActions', () => {
  it('renders the component with heading', () => {
    render(<QuickActions />);

    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
  });

  it('renders two action buttons', () => {
    render(<QuickActions />);

    const buttons = screen.getAllByRole('link');
    expect(buttons).toHaveLength(2);
  });

  it('renders "Start Practice" button with correct link', () => {
    render(<QuickActions />);

    const startButton = screen.getByRole('link', { name: /start practice/i });
    expect(startButton).toBeInTheDocument();
    expect(startButton).toHaveAttribute('href', '/questions');
  });

  it('renders "View All Questions" button with correct link', () => {
    render(<QuickActions />);

    const viewButton = screen.getByRole('link', { name: /view all questions/i });
    expect(viewButton).toBeInTheDocument();
    expect(viewButton).toHaveAttribute('href', '/questions');
  });

  it('applies primary styling to "Start Practice" button', () => {
    render(<QuickActions />);

    const startButton = screen.getByRole('link', { name: /start practice/i });
    expect(startButton).toHaveClass('bg-primary-600', 'text-white');
  });

  it('applies secondary styling to "View All Questions" button', () => {
    render(<QuickActions />);

    const viewButton = screen.getByRole('link', { name: /view all questions/i });
    expect(viewButton).toHaveClass('bg-white', 'border-2', 'border-gray-200');
  });

  it('has responsive grid layout', () => {
    const { container } = render(<QuickActions />);

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1', 'sm:grid-cols-2');
  });

  it('has proper spacing between buttons', () => {
    const { container } = render(<QuickActions />);

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('gap-4');
  });
});

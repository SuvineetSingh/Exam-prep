import { render, screen } from '@testing-library/react';
import { StatCard } from '../StatCard';

describe('StatCard', () => {
  it('renders with required props', () => {
    render(
      <StatCard
        title="Test Title"
        value={42}
        icon="📊"
      />
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('📊')).toBeInTheDocument();
  });

  it('renders with string value', () => {
    render(
      <StatCard
        title="Percentage"
        value="85%"
        icon="✓"
      />
    );

    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('renders with subtitle', () => {
    render(
      <StatCard
        title="Questions"
        value={100}
        subtitle="+5 today"
        icon="📊"
      />
    );

    expect(screen.getByText('+5 today')).toBeInTheDocument();
  });

  it('renders without subtitle', () => {
    render(
      <StatCard
        title="Questions"
        value={100}
        icon="📊"
      />
    );

    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  });

  it('applies custom icon background color', () => {
    const { container } = render(
      <StatCard
        title="Test"
        value={10}
        icon="🔥"
        iconBg="bg-red-100"
      />
    );

    const iconElement = container.querySelector('.bg-red-100');
    expect(iconElement).toBeInTheDocument();
  });

  it('applies default icon background if not provided', () => {
    const { container } = render(
      <StatCard
        title="Test"
        value={10}
        icon="📊"
      />
    );

    const iconElement = container.querySelector('.bg-primary-100');
    expect(iconElement).toBeInTheDocument();
  });

  it('has hover effect class', () => {
    const { container } = render(
      <StatCard
        title="Test"
        value={10}
        icon="📊"
      />
    );

    const card = container.firstChild;
    expect(card).toHaveClass('hover:shadow-md');
  });

  it('renders with correct typography classes', () => {
    render(
      <StatCard
        title="Test Title"
        value={42}
        subtitle="Subtitle"
        icon="📊"
      />
    );

    const title = screen.getByText('Test Title');
    expect(title).toHaveClass('text-sm', 'font-medium', 'text-gray-600');

    const value = screen.getByText('42');
    expect(value).toHaveClass('text-3xl', 'font-bold', 'text-gray-900');

    const subtitle = screen.getByText('Subtitle');
    expect(subtitle).toHaveClass('text-sm', 'text-gray-500');
  });

  it('renders with rounded corners and shadow', () => {
    const { container } = render(
      <StatCard
        title="Test"
        value={10}
        icon="📊"
      />
    );

    const card = container.firstChild;
    expect(card).toHaveClass('rounded-lg', 'shadow-sm');
  });
});

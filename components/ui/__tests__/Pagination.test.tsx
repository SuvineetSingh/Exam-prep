import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from '../Pagination';

describe('Pagination', () => {
  const mockOnPageChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with correct item count', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        totalItems={100}
        itemsPerPage={20}
        onPageChange={mockOnPageChange}
      />
    );

    expect(screen.getByText(/showing 1-20 of 100 questions/i)).toBeInTheDocument();
  });

  it('displays correct range for middle page', () => {
    render(
      <Pagination
        currentPage={3}
        totalPages={5}
        totalItems={100}
        itemsPerPage={20}
        onPageChange={mockOnPageChange}
      />
    );

    expect(screen.getByText(/showing 41-60 of 100 questions/i)).toBeInTheDocument();
  });

  it('displays correct range for last page', () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={5}
        totalItems={93}
        itemsPerPage={20}
        onPageChange={mockOnPageChange}
      />
    );

    expect(screen.getByText(/showing 81-93 of 93 questions/i)).toBeInTheDocument();
  });

  it('renders Previous and Next buttons', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        totalItems={100}
        itemsPerPage={20}
        onPageChange={mockOnPageChange}
      />
    );

    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  it('disables Previous button on first page', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        totalItems={100}
        itemsPerPage={20}
        onPageChange={mockOnPageChange}
      />
    );

    const prevButton = screen.getByRole('button', { name: /previous/i });
    expect(prevButton).toBeDisabled();
  });

  it('disables Next button on last page', () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={5}
        totalItems={100}
        itemsPerPage={20}
        onPageChange={mockOnPageChange}
      />
    );

    const nextButton = screen.getByRole('button', { name: /next/i });
    expect(nextButton).toBeDisabled();
  });

  it('calls onPageChange when Previous is clicked', () => {
    render(
      <Pagination
        currentPage={3}
        totalPages={5}
        totalItems={100}
        itemsPerPage={20}
        onPageChange={mockOnPageChange}
      />
    );

    const prevButton = screen.getByRole('button', { name: /previous/i });
    fireEvent.click(prevButton);

    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange when Next is clicked', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        totalItems={100}
        itemsPerPage={20}
        onPageChange={mockOnPageChange}
      />
    );

    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    expect(mockOnPageChange).toHaveBeenCalledWith(3);
  });

  it('renders page number buttons', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        totalItems={100}
        itemsPerPage={20}
        onPageChange={mockOnPageChange}
      />
    );

    // Should show pages 1-5 since totalPages <= 7
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '4' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '5' })).toBeInTheDocument();
  });

  it('highlights current page button', () => {
    render(
      <Pagination
        currentPage={3}
        totalPages={5}
        totalItems={100}
        itemsPerPage={20}
        onPageChange={mockOnPageChange}
      />
    );

    const currentPageButton = screen.getByRole('button', { name: '3' });
    expect(currentPageButton).toHaveClass('bg-primary-600', 'text-white');
  });

  it('calls onPageChange when a page number is clicked', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        totalItems={100}
        itemsPerPage={20}
        onPageChange={mockOnPageChange}
      />
    );

    const page3Button = screen.getByRole('button', { name: '3' });
    fireEvent.click(page3Button);

    expect(mockOnPageChange).toHaveBeenCalledWith(3);
  });

  it('shows ellipsis for many pages', () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={10}
        totalItems={200}
        itemsPerPage={20}
        onPageChange={mockOnPageChange}
      />
    );

    const ellipsis = screen.getAllByText('...');
    expect(ellipsis.length).toBeGreaterThan(0);
  });

  it('renders with single page', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={1}
        totalItems={10}
        itemsPerPage={20}
        onPageChange={mockOnPageChange}
      />
    );

    expect(screen.getByText(/showing 1-10 of 10 questions/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
  });

  it('has responsive layout', () => {
    const { container } = render(
      <Pagination
        currentPage={1}
        totalPages={5}
        totalItems={100}
        itemsPerPage={20}
        onPageChange={mockOnPageChange}
      />
    );

    const pagination = container.firstChild;
    expect(pagination).toHaveClass('bg-white', 'rounded-lg', 'shadow-sm');
  });
});

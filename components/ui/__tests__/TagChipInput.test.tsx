import { render, screen, fireEvent } from '@testing-library/react';
import { TagChipInput } from '../TagChipInput';
import { fetchTagSuggestions } from '@/lib/supabase/queries/tagQueries';

jest.mock('@/lib/supabase/queries/tagQueries');

describe('TagChipInput', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (fetchTagSuggestions as jest.Mock).mockResolvedValue([]);
  });

  it('adds a tag on Enter', () => {
    render(<TagChipInput value={[]} onChange={mockOnChange} />);
    const input = screen.getByPlaceholderText(/type a tag/i);
    fireEvent.change(input, { target: { value: 'JavaScript' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockOnChange).toHaveBeenCalledWith(['JavaScript']);
  });

  it('removes a tag when its × button is clicked', () => {
    render(<TagChipInput value={['JavaScript', 'Java']} onChange={mockOnChange} />);
    fireEvent.click(screen.getByLabelText('Remove JavaScript'));
    expect(mockOnChange).toHaveBeenCalledWith(['Java']);
  });

  it('removes the last tag on Backspace when the draft is empty', () => {
    render(<TagChipInput value={['JavaScript', 'Java']} onChange={mockOnChange} />);
    const input = screen.getByPlaceholderText(/type a tag/i);
    fireEvent.keyDown(input, { key: 'Backspace' });
    expect(mockOnChange).toHaveBeenCalledWith(['JavaScript']);
  });

  it('does not add a case-insensitive duplicate tag', () => {
    render(<TagChipInput value={['JavaScript']} onChange={mockOnChange} />);
    const input = screen.getByPlaceholderText(/type a tag/i);
    fireEvent.change(input, { target: { value: 'javascript' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('does not add a tag past the max cap and hides the input', () => {
    render(
      <TagChipInput value={['a', 'b', 'c']} onChange={mockOnChange} max={3} />
    );
    expect(screen.queryByPlaceholderText(/type a tag/i)).not.toBeInTheDocument();
  });

  it('shows the current/max count', () => {
    render(<TagChipInput value={['a', 'b']} onChange={mockOnChange} max={5} />);
    expect(screen.getByText('2/5 tags')).toBeInTheDocument();
  });

  it('allows unlimited tags and shows a plain count when max is omitted', () => {
    render(<TagChipInput value={['a', 'b', 'c', 'd', 'e', 'f']} onChange={mockOnChange} />);
    expect(screen.getByPlaceholderText(/type a tag/i)).toBeInTheDocument();
    expect(screen.getByText('6 tags')).toBeInTheDocument();
  });
});

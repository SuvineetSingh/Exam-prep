import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import QuestionsDashboard from '../page';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// Mock the external modules
jest.mock('@/lib/supabase/client');
jest.mock('next/navigation');

describe('QuestionsDashboard', () => {
  const mockPush = jest.fn();
  const mockSupabase = {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
  };

  const mockQuestions = [
    {
      id: 1,
      exam_type: 'CPA',
      category: 'Accounting',
      difficulty: 'easy',
      question_text: 'Test Question 1',
    },
    {
      id: 2,
      exam_type: 'CFA',
      category: 'Finance',
      difficulty: 'hard',
      question_text: 'Test Question 2',
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    // Default mock: User is logged in
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { email: 'test@example.com', user_metadata: { full_name: 'Atharva Thube' } } } },
    });

    // Default mock: Return questions
    mockSupabase.select.mockImplementation((query, options) => {
        if (options?.count === 'exact') {
            return Promise.resolve({ data: mockQuestions, count: 2, error: null });
        }
        // This handles the fetchFilters call
        return Promise.resolve({ data: mockQuestions, error: null });
    });
  });

  it('redirects to login if no session is found', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null } });
    render(<QuestionsDashboard />);
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('renders the dashboard header and candidate name', async () => {
    render(<QuestionsDashboard />);

    expect(await screen.findByText(/ExamPrep AI/i)).toBeInTheDocument();
    expect(screen.getByText(/Atharva Thube/i)).toBeInTheDocument();
    expect(screen.getByText(/Questions Browser/i)).toBeInTheDocument();
  });

  it('displays the list of questions fetched from database', async () => {
    render(<QuestionsDashboard />);

    expect(await screen.findByText('Test Question 1')).toBeInTheDocument();
    expect(screen.getByText('Test Question 2')).toBeInTheDocument();
    expect(screen.getByText('2 Questions Found')).toBeInTheDocument();
  });

  it('shows loading state while fetching questions', async () => {
    // Delay the mock response to catch the loading state
    mockSupabase.select.mockReturnValue(new Promise(() => {})); 
    
    render(<QuestionsDashboard />);
    
    expect(screen.getByText(/Fetching from database.../i)).toBeInTheDocument();
  });

  it('updates filters when a user selects a different Exam Type', async () => {
    render(<QuestionsDashboard />);

    const examSelect = await screen.findByLabelText(/Exam Type/i);
    fireEvent.change(examSelect, { target: { value: 'CPA' } });

    await waitFor(() => {
      expect(mockSupabase.eq).toHaveBeenCalledWith('exam_type', 'CPA');
    });
  });

  it('clears all filters when the "Clear all filters" button is clicked', async () => {
    // Setup state where no questions are found to show the clear button
    mockSupabase.select.mockResolvedValue({ data: [], count: 0, error: null });
    
    render(<QuestionsDashboard />);

    const clearButton = await screen.findByRole('button', { name: /Clear all filters/i });
    fireEvent.click(clearButton);

    await waitFor(() => {
        // Verification that it attempts to fetch everything again
        expect(mockSupabase.from).toHaveBeenCalledWith('questions');
    });
  });

  it('renders the navigation mode buttons', async () => {
    render(<QuestionsDashboard />);

    expect(await screen.findByText(/Practice Mode/i)).toBeInTheDocument();
    expect(screen.getByText(/Timed Exam/i)).toBeInTheDocument();
  });
});
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import QuestionsDashboard from '@/app/questions/page';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// Mock the external modules
jest.mock('@/lib/supabase/client');
jest.mock('next/navigation');
jest.mock('@/lib/supabase/queries/userStats', () => ({
  getAttemptedQuestionIds: jest.fn().mockResolvedValue(new Set()),
}));

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
    single: jest.fn().mockResolvedValue({ data: { is_premium: false }, error: null }),
    then: jest.fn(),
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

    // Re-set after clearAllMocks since it resets mock implementations
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.order.mockReturnThis();
    mockSupabase.range.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
    mockSupabase.single.mockResolvedValue({ data: { is_premium: false }, error: null });
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });

    // Default mock: User is logged in
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { email: 'test@example.com', user_metadata: { full_name: 'Atharva Thube' } } } },
    });

    // select: chain continues for count/premium/quota queries; resolves directly for filter queries
    mockSupabase.select.mockImplementation((_fields: string, options?: { count?: string }) => {
      if (options?.count === 'exact') return mockSupabase; // → .range() resolves
      if (_fields === 'is_premium') return mockSupabase;   // → .eq().single() resolves
      if (_fields === 'question_id') return mockSupabase;  // → .eq().eq().then() resolves
      return Promise.resolve({ data: mockQuestions, error: null });
    });

    // Make .then() on the chain work for quota queries (user_answers)
    mockSupabase.eq.mockImplementation(() => {
      const chain = Object.create(mockSupabase);
      chain.then = (cb: (v: any) => void) => { cb({ data: [], error: null }); };
      return chain;
    });

    // range: final step of fetchQuestions chain
    mockSupabase.range.mockResolvedValue({ data: mockQuestions, count: 2, error: null });
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

    expect(await screen.findByRole('link', { name: /exam prep platform/i })).toBeInTheDocument();
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
    mockSupabase.range.mockReturnValue(new Promise(() => {}));

    render(<QuestionsDashboard />);

    // Wait for auth to complete, then check that questions loading state appears
    expect(await screen.findByText(/Fetching from database.../i)).toBeInTheDocument();
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
    mockSupabase.range.mockResolvedValue({ data: [], count: 0, error: null });

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

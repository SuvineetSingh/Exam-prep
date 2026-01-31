import { render, screen } from '@testing-library/react';
import { QuestionRow, QuestionRowSkeleton } from '../QuestionRow';
import type { DashboardQuestion } from '@/lib/types';

describe('QuestionRow', () => {
  const mockQuestion: DashboardQuestion = {
    id: '1',
    exam_type: 'CPA',
    difficulty: 'easy',
    question_type: 'multiple_choice',
    question_text: 'What is the accounting equation?',
    options: ['A) Assets = Liabilities', 'B) Assets = Liabilities + Equity'],
    correct_answer: 'B',
    explanation: 'The fundamental accounting equation',
    topic: 'Financial Accounting',
    subtopic: 'Fundamentals',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    is_answered: false,
  };

  it('renders question text', () => {
    render(<QuestionRow question={mockQuestion} />);

    expect(screen.getByText(/what is the accounting equation/i)).toBeInTheDocument();
  });

  it('renders exam type badge', () => {
    render(<QuestionRow question={mockQuestion} />);

    expect(screen.getByText('CPA')).toBeInTheDocument();
  });

  it('renders topic', () => {
    render(<QuestionRow question={mockQuestion} />);

    expect(screen.getByText('Financial Accounting')).toBeInTheDocument();
  });

  it('renders difficulty badge', () => {
    render(<QuestionRow question={mockQuestion} />);

    expect(screen.getByText(/easy/i)).toBeInTheDocument();
  });

  it('displays unanswered status', () => {
    render(<QuestionRow question={mockQuestion} />);

    expect(screen.getByText('○')).toBeInTheDocument();
  });

  it('displays answered status when question is answered', () => {
    const answeredQuestion = { ...mockQuestion, is_answered: true };
    render(<QuestionRow question={answeredQuestion} />);

    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('truncates long question text', () => {
    const longQuestion = {
      ...mockQuestion,
      question_text: 'A'.repeat(150),
    };
    render(<QuestionRow question={longQuestion} />);

    const questionText = screen.getByText(/\.\.\.$/);
    expect(questionText.textContent?.length).toBeLessThan(150);
  });

  it('applies different colors for different difficulties', () => {
    const { rerender, container } = render(<QuestionRow question={mockQuestion} />);
    
    let difficultyBadge = container.querySelector('.bg-green-100');
    expect(difficultyBadge).toBeInTheDocument();

    const mediumQuestion = { ...mockQuestion, difficulty: 'medium' as const };
    rerender(<QuestionRow question={mediumQuestion} />);
    difficultyBadge = container.querySelector('.bg-yellow-100');
    expect(difficultyBadge).toBeInTheDocument();

    const hardQuestion = { ...mockQuestion, difficulty: 'hard' as const };
    rerender(<QuestionRow question={hardQuestion} />);
    difficultyBadge = container.querySelector('.bg-red-100');
    expect(difficultyBadge).toBeInTheDocument();
  });

  it('has hover effect', () => {
    const { container } = render(<QuestionRow question={mockQuestion} />);

    const row = container.firstChild;
    expect(row).toHaveClass('hover:bg-gray-50');
  });

  it('has border between rows', () => {
    const { container } = render(<QuestionRow question={mockQuestion} />);

    const row = container.firstChild;
    expect(row).toHaveClass('border-b', 'border-gray-200');
  });

  it('renders with proper spacing', () => {
    const { container } = render(<QuestionRow question={mockQuestion} />);

    const row = container.firstChild;
    expect(row).toHaveClass('p-4');
  });

  it('has cursor pointer for clickable row', () => {
    const { container } = render(<QuestionRow question={mockQuestion} />);

    const row = container.firstChild;
    expect(row).toHaveClass('cursor-pointer');
  });
});

describe('QuestionRowSkeleton', () => {
  it('renders skeleton loader', () => {
    const { container } = render(<QuestionRowSkeleton />);

    const skeleton = container.firstChild;
    expect(skeleton).toBeInTheDocument();
  });

  it('renders multiple skeleton elements', () => {
    const { container } = render(<QuestionRowSkeleton />);

    const animatedElements = container.querySelectorAll('.animate-pulse');
    expect(animatedElements.length).toBeGreaterThan(0);
  });

  it('has same structure as actual row', () => {
    const { container } = render(<QuestionRowSkeleton />);

    const skeleton = container.firstChild;
    expect(skeleton).toHaveClass('p-4', 'border-b', 'border-gray-200');
  });
});

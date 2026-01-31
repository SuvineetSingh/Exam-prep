import { getUserStats } from '../userStats';
import { createClient } from '@/lib/supabase/client';

jest.mock('@/lib/supabase/client');

describe('getUserStats', () => {
  const mockUser = { id: 'user-123' };
  const mockSelect = jest.fn();
  const mockEq = jest.fn();
  const mockGetUser = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockEq.mockResolvedValue({ data: [], error: null });
    mockSelect.mockReturnValue({ eq: mockEq });
    (createClient as jest.Mock).mockReturnValue({
      auth: {
        getUser: mockGetUser,
      },
      from: jest.fn(() => ({
        select: mockSelect,
      })),
    });
  });

  it('returns null if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await getUserStats();

    expect(result).toBeNull();
  });

  it('returns default stats when user has no answers', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mockEq.mockResolvedValue({ data: [], error: null });

    const result = await getUserStats();

    expect(result).toEqual({
      total_answered: 0,
      accuracy_rate: 0,
      study_streak: 0,
      today_count: 0,
      this_week_improvement: 0,
    });
  });

  it('calculates total answered correctly', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mockEq.mockResolvedValue({
      data: [
        { is_correct: true, created_at: '2024-01-01T10:00:00Z' },
        { is_correct: false, created_at: '2024-01-01T11:00:00Z' },
        { is_correct: true, created_at: '2024-01-02T10:00:00Z' },
      ],
      error: null,
    });

    const result = await getUserStats();

    expect(result?.total_answered).toBe(3);
  });

  it('calculates accuracy rate correctly', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mockEq.mockResolvedValue({
      data: [
        { is_correct: true, created_at: '2024-01-01T10:00:00Z' },
        { is_correct: true, created_at: '2024-01-01T11:00:00Z' },
        { is_correct: false, created_at: '2024-01-02T10:00:00Z' },
        { is_correct: true, created_at: '2024-01-03T10:00:00Z' },
      ],
      error: null,
    });

    const result = await getUserStats();

    expect(result?.accuracy_rate).toBe(75); // 3 out of 4 correct = 75%
  });

  it('calculates today count correctly', async () => {
    const today = new Date().toISOString().split('T')[0];
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mockEq.mockResolvedValue({
      data: [
        { is_correct: true, created_at: `${today}T10:00:00Z` },
        { is_correct: false, created_at: `${today}T11:00:00Z` },
        { is_correct: true, created_at: '2024-01-01T10:00:00Z' },
      ],
      error: null,
    });

    const result = await getUserStats();

    expect(result?.today_count).toBe(2);
  });

  it('returns default stats on database error', async () => {
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation();
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mockEq.mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    });

    const result = await getUserStats();

    expect(result).toEqual({
      total_answered: 0,
      accuracy_rate: 0,
      study_streak: 0,
      today_count: 0,
      this_week_improvement: 0,
    });

    consoleWarn.mockRestore();
  });

  it('queries the correct table and user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });

    await getUserStats();

    const supabase = createClient();
    expect(supabase.from).toHaveBeenCalledWith('user_answers');
    expect(mockSelect).toHaveBeenCalledWith('is_correct, created_at');
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123');
  });

  it('handles null data gracefully', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mockEq.mockResolvedValue({ data: null, error: null });

    const result = await getUserStats();

    expect(result).toEqual({
      total_answered: 0,
      accuracy_rate: 0,
      study_streak: 0,
      today_count: 0,
      this_week_improvement: 0,
    });
  });

  it('calculates streak for consecutive days', async () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mockEq.mockResolvedValue({
      data: [
        { is_correct: true, created_at: today.toISOString() },
        { is_correct: true, created_at: yesterday.toISOString() },
        { is_correct: true, created_at: twoDaysAgo.toISOString() },
      ],
      error: null,
    });

    const result = await getUserStats();

    expect(result?.study_streak).toBeGreaterThan(0);
  });
});

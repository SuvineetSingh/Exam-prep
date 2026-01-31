import { renderHook, waitFor } from '@testing-library/react';
import { useUserStats } from '../useUserStats';
import { getUserStats } from '@/lib/supabase/queries/userStats';

jest.mock('@/lib/supabase/queries/userStats');

describe('useUserStats', () => {
  const mockStats = {
    total_answered: 42,
    accuracy_rate: 85,
    study_streak: 7,
    today_count: 5,
    this_week_improvement: 2,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns loading state initially', () => {
    (getUserStats as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { result } = renderHook(() => useUserStats());

    expect(result.current.loading).toBe(true);
    expect(result.current.stats).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('fetches and returns user stats', async () => {
    (getUserStats as jest.Mock).mockResolvedValue(mockStats);

    const { result } = renderHook(() => useUserStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats).toEqual(mockStats);
    expect(result.current.error).toBeNull();
  });

  it('returns default stats when getUserStats returns null', async () => {
    (getUserStats as jest.Mock).mockResolvedValue(null);

    const { result } = renderHook(() => useUserStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats).toEqual({
      total_answered: 0,
      accuracy_rate: 0,
      study_streak: 0,
      today_count: 0,
      this_week_improvement: 0,
    });
    expect(result.current.error).toBeNull();
  });

  it('handles errors gracefully', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    (getUserStats as jest.Mock).mockRejectedValue(new Error('Database error'));

    const { result } = renderHook(() => useUserStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats).toEqual({
      total_answered: 0,
      accuracy_rate: 0,
      study_streak: 0,
      today_count: 0,
      this_week_improvement: 0,
    });
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('sets loading to false after successful fetch', async () => {
    (getUserStats as jest.Mock).mockResolvedValue(mockStats);

    const { result } = renderHook(() => useUserStats());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('calls getUserStats on mount', async () => {
    (getUserStats as jest.Mock).mockResolvedValue(mockStats);

    renderHook(() => useUserStats());

    await waitFor(() => {
      expect(getUserStats).toHaveBeenCalledTimes(1);
    });
  });

  it('does not refetch on re-render', async () => {
    (getUserStats as jest.Mock).mockResolvedValue(mockStats);

    const { rerender } = renderHook(() => useUserStats());

    await waitFor(() => {
      expect(getUserStats).toHaveBeenCalledTimes(1);
    });

    rerender();

    await waitFor(() => {
      expect(getUserStats).toHaveBeenCalledTimes(1); // Still 1, not 2
    });
  });
});

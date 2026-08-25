'use client';

import { useEffect, type RefObject } from 'react';

const LOAD_THRESHOLD_PX = 100;

/** Calls onLoadMore when `containerRef` is scrolled within LOAD_THRESHOLD_PX of its bottom. */
export function useInfiniteScroll(
  containerRef: RefObject<HTMLElement | null>,
  onLoadMore: () => void,
  hasMore: boolean,
  loading: boolean
) {
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !hasMore) return;
    const onScroll = () => {
      if (loading) return;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - LOAD_THRESHOLD_PX) {
        onLoadMore();
      }
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [containerRef, onLoadMore, hasMore, loading]);
}

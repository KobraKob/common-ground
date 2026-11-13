'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';

interface VirtualizedFeedProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  estimateSize?: number;
  overscan?: number;
  className?: string;
  hasMore?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
}

export function VirtualizedFeed<T>({
  items,
  renderItem,
  estimateSize = 360,
  overscan = 4,
  className = '',
  hasMore = false,
  isFetchingNextPage = false,
  onLoadMore,
}: VirtualizedFeedProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  useEffect(() => {
    const updateOffset = () => setScrollMargin(parentRef.current?.offsetTop ?? 0);
    updateOffset();
    window.addEventListener('resize', updateOffset);
    return () => window.removeEventListener('resize', updateOffset);
  }, []);

  const virtualizer = useWindowVirtualizer({ count: items.length, estimateSize: () => estimateSize, overscan, scrollMargin });
  const virtualItems = virtualizer.getVirtualItems();

  useEffect(() => {
    const last = virtualItems[virtualItems.length - 1];
    if (last && last.index >= items.length - 3 && hasMore && !isFetchingNextPage) onLoadMore?.();
  }, [virtualItems, items.length, hasMore, isFetchingNextPage, onLoadMore]);

  if (items.length === 0) return null;
  return <div ref={parentRef} className={`relative w-full ${className}`} style={{ height: virtualizer.getTotalSize() }}>
    {virtualItems.map((row) => <div key={row.key} ref={virtualizer.measureElement} data-index={row.index} className="absolute left-0 top-0 w-full" style={{ transform: `translateY(${row.start - scrollMargin}px)` }}>
      {renderItem(items[row.index], row.index)}
    </div>)}
    {isFetchingNextPage && <div className="absolute bottom-0 left-0 right-0 py-4 text-center text-xs text-[var(--text-muted)]">Loading more posts…</div>}
  </div>;
}

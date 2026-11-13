'use client';

import React, { useLayoutEffect, useRef, useState } from 'react';
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
  emptyPlaceholder?: React.ReactNode;
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
  emptyPlaceholder,
}: VirtualizedFeedProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);
  const virtualizer = useWindowVirtualizer({
    count: items.length,
    estimateSize: () => estimateSize,
    overscan,
    scrollMargin,
    getItemKey: (index) => index,
  });
  const virtualItems = virtualizer.getVirtualItems();

  useLayoutEffect(() => {
    const measure = () => setScrollMargin(parentRef.current?.offsetTop ?? 0);
    measure();
    window.addEventListener('resize', measure, { passive: true });
    return () => window.removeEventListener('resize', measure);
  }, []);

  useLayoutEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1];
    if (!lastItem || lastItem.index < items.length - 3 || !hasMore || isFetchingNextPage || !onLoadMore) return;
    onLoadMore();
  }, [virtualItems, items.length, hasMore, isFetchingNextPage, onLoadMore]);

  if (!items.length) return <>{emptyPlaceholder || null}</>;

  return (
    <div ref={parentRef} className={className} style={{ height: virtualizer.getTotalSize(), position: 'relative', width: '100%' }}>
      {virtualItems.map((virtualRow) => (
        <div
          key={virtualRow.key}
          ref={virtualizer.measureElement}
          data-index={virtualRow.index}
          className="absolute left-0 top-0 w-full pb-5"
          style={{ transform: `translateY(${virtualRow.start - scrollMargin}px)` }}
        >
          {renderItem(items[virtualRow.index], virtualRow.index)}
        </div>
      ))}
      {isFetchingNextPage && <div role="status" className="absolute left-0 right-0 top-full py-4 text-center text-sm cg-muted">Loading more posts…</div>}
    </div>
  );
}

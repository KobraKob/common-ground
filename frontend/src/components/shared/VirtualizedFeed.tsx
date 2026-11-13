'use client';

import React, { useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

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
  estimateSize = 240,
  overscan = 5,
  className = '',
  hasMore = false,
  isFetchingNextPage = false,
  onLoadMore,
  emptyPlaceholder,
}: VirtualizedFeedProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Trigger infinite scroll when near bottom of virtual items
  useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1];
    if (!lastItem) return;

    if (
      lastItem.index >= items.length - 2 &&
      hasMore &&
      !isFetchingNextPage &&
      onLoadMore
    ) {
      onLoadMore();
    }
  }, [virtualItems, items.length, hasMore, isFetchingNextPage, onLoadMore]);

  if (items.length === 0) {
    return <>{emptyPlaceholder || null}</>;
  }

  return (
    <div
      ref={parentRef}
      className={`relative overflow-y-auto max-h-[85vh] scroll-smooth ${className}`}
      style={{ contain: 'strict' }}
    >
      <div
        className="w-full relative"
        style={{
          height: `${virtualizer.getTotalSize()}px`,
        }}
      >
        {virtualItems.map((virtualRow) => {
          const item = items[virtualRow.index];
          return (
            <div
              key={virtualRow.index}
              ref={virtualizer.measureElement}
              data-index={virtualRow.index}
              className="absolute top-0 left-0 w-full"
              style={{
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {renderItem(item, virtualRow.index)}
            </div>
          );
        })}
      </div>

      {isFetchingNextPage && (
        <div className="py-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#12151F] border border-white/10 text-xs font-mono text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Loading older posts...</span>
          </div>
        </div>
      )}
    </div>
  );
}

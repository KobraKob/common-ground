'use client';

import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { ImageIcon } from 'lucide-react';

interface OptimizedImageProps extends Omit<ImageProps, 'src' | 'alt'> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  containerClassName?: string;
}

const ALLOWED_HOSTS = [
  'images.unsplash.com',
  'avatars.githubusercontent.com',
  'api.dicebear.com',
  'res.cloudinary.com',
  'images.pexels.com',
  'cdn.pixabay.com',
  'commonground.in',
];

export function OptimizedImage({
  src,
  alt,
  fallbackSrc,
  className = '',
  containerClassName = '',
  priority = false,
  fill = false,
  width,
  height,
  ...rest
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Check if src is valid for Next.js Image optimization
  const isRelative = src.startsWith('/');
  const isDataUrl = src.startsWith('data:');
  const isBlobUrl = src.startsWith('blob:');

  let canOptimize = isRelative;
  if (!isRelative && !isDataUrl && !isBlobUrl) {
    try {
      const url = new URL(src);
      canOptimize = ALLOWED_HOSTS.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`));
    } catch {
      canOptimize = false;
    }
  }

  if (hasError) {
    if (fallbackSrc) {
      return (
        <img
          src={fallbackSrc}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          className={className}
        />
      );
    }

    return (
      <div className={`flex flex-col items-center justify-center bg-purple-950/40 border border-purple-400/20 text-[#C4B5FD] p-4 text-xs font-mono ${containerClassName} ${className}`}>
        <ImageIcon className="w-6 h-6 mb-1 text-purple-400/60" />
        <span className="text-[10px] text-purple-300/80">Image unavailable</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      {/* Loading shimmer skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-purple-950/30 via-purple-900/40 to-purple-950/30 animate-pulse z-10 pointer-events-none" />
      )}

      {canOptimize ? (
        <Image
          src={src}
          alt={alt}
          priority={priority}
          fill={fill}
          width={!fill ? width || 800 : undefined}
          height={!fill ? height || 600 : undefined}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          onLoad={() => setIsLoading(false)}
          onError={() => setHasError(true)}
          className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${className}`}
          {...rest}
        />
      ) : (
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setIsLoading(false)}
          onError={() => setHasError(true)}
          className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${className}`}
        />
      )}
    </div>
  );
}

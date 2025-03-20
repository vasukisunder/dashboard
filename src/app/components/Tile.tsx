'use client';

import { ReactNode } from 'react';

export type TileSize = 'small' | 'medium' | 'large' | 'wide' | 'tall' | 'squarish';

interface TileProps {
  title?: string; // Keeping this for backward compatibility but won't display it
  size?: TileSize;
  children: ReactNode;
  className?: string;
}

// Defining sizes with more consistent proportions
const sizeClasses = {
  small: 'col-span-1 h-full',
  medium: 'col-span-1 h-full',
  large: 'col-span-2 h-full',
  wide: 'col-span-2 h-full',
  tall: 'col-span-1 h-full',
  squarish: 'col-span-1 row-span-2 h-full'
};

export default function Tile({ size = 'medium', children, className = '' }: TileProps) {
  return (
    <div 
      className={`
        ${sizeClasses[size]} 
        bg-[var(--tile-background)]
        border border-[var(--tile-border)]
        p-4
        overflow-auto 
        flex items-center justify-center
        transition-all duration-200
        h-full w-full
        ${className}
      `}
    >
      {children}
    </div>
  );
} 
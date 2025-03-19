'use client';

import { ReactNode } from 'react';

export type TileSize = 'small' | 'medium' | 'large' | 'wide' | 'tall';

interface TileProps {
  title?: string;
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
  tall: 'col-span-1 h-full'
};

export default function Tile({ title, size = 'medium', children, className = '' }: TileProps) {
  return (
    <div 
      className={`
        ${sizeClasses[size]} 
        bg-[var(--tile-background)]
        border border-[var(--tile-border)]
        p-4
        overflow-auto 
        flex flex-col 
        transition-all duration-200
        h-full w-full
        ${className}
      `}
    >
      {title && <h3 className="text-lg font-medium mb-3 opacity-80">{title}</h3>}
      <div className="flex-1 flex items-center justify-center overflow-auto">
        {children}
      </div>
    </div>
  );
} 
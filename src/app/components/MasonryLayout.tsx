'use client';

import { ReactNode, useState, useEffect } from 'react';

interface MasonryLayoutProps {
  children: ReactNode[];
}

export default function MasonryLayout({ children }: MasonryLayoutProps) {
  const [columns, setColumns] = useState(4);

  // Adjust number of columns based on screen width
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setColumns(1); // Mobile: stack in one column
      } else if (width < 768) {
        setColumns(2); // Small tablets: 2 columns
      } else if (width < 1024) {
        setColumns(3); // Tablets: 3 columns
      } else {
        setColumns(4); // Desktops: 4 columns
      }
    };

    handleResize(); // Set initial state
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="w-full h-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 auto-rows-fr gap-3 w-full h-full">
        {children}
      </div>
    </div>
  );
} 
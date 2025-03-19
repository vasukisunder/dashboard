'use client';

import { ReactNode, useEffect, useState } from 'react';

interface DashboardProps {
  children: ReactNode;
  refreshInterval?: number; // in milliseconds
  onRefresh?: () => void;
}

export default function Dashboard({ 
  children, 
  refreshInterval = 60000, // 1 minute default
  onRefresh 
}: DashboardProps) {
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefreshed(new Date());
      if (onRefresh) onRefresh();
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [refreshInterval, onRefresh]);

  return (
    <main className="h-screen w-full bg-[var(--background)] flex items-center justify-center">
      <div className="w-full h-full max-h-screen p-3">
        {children}
      </div>
    </main>
  );
} 
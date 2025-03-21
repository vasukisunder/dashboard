'use client';

import { useState, useEffect } from 'react';
import Tile from './Tile';

export default function Clock() {
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const formatTime = (time: Date) => {
    let hours = time.getHours();
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const seconds = time.getSeconds().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    // Convert to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    
    return `${hours}:${minutes}:${seconds} ${ampm}`;
  };
  
  return (
    <Tile size="wide" className="col-span-2">
      <div className="w-full flex justify-between items-center">
        <div className="text-2xl sm:text-3xl font-mono tracking-wider">
          {formatTime(time)}
        </div>
        <div className="text-xs text-gray-500 text-right">
          <div>Real-time dashboard displaying updating content</div>
          <div>Custom data tiles from multiple APIs with auto-refresh</div>
        </div>
      </div>
    </Tile>
  );
} 
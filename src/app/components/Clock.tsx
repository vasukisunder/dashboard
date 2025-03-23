'use client';

import { useState, useEffect } from 'react';
import Tile from './Tile';
import Image from 'next/image';

interface ClockProps {
  onClickImage?: () => void;
}

export default function Clock({ onClickImage }: ClockProps) {
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
    <Tile size="wide" className="col-span-2 text-white">
      <div className="w-full flex justify-between items-center">
        <div className="relative h-12 w-36 flex items-center">
          <Image 
            src="/earth.png" 
            alt="Digital Clock" 
            width={140} 
            height={48} 
            className="object-contain cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onClickImage}
          />
        </div>
        <div className="text-right">
          <div className="title">MACRODATA DASHBOARD</div>
          <div className="text-xs text-[var(--accent-teal)]">Real-time data dashboard</div>
        </div>
      </div>
    </Tile>
  );
} 
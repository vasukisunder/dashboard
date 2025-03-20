'use client';

import { useState, useEffect } from 'react';
import Tile from '../Tile';
import { TileSize } from '../Tile';

// Global statistics - approximately 385,000 babies born daily worldwide
// This is about 4.45 babies born per second
const BABIES_PER_DAY = 385000;
const BABIES_PER_SECOND = BABIES_PER_DAY / 86400; // 86400 seconds in a day

interface BabyCounterTileProps {
  size?: TileSize;
  refreshTimestamp?: Date;
}

export default function BabyCounterTile({ 
  size = 'small', 
  refreshTimestamp 
}: BabyCounterTileProps) {
  const [babyCount, setBabyCount] = useState<number>(0);

  useEffect(() => {
    // Calculate how many babies born so far today
    const calculateBabiesBorn = () => {
      const now = new Date();
      
      // Get seconds elapsed since midnight today
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const secondsToday = Math.floor((now.getTime() - start.getTime()) / 1000);
      
      // Calculate babies born
      const count = Math.floor(secondsToday * BABIES_PER_SECOND);
      setBabyCount(count);
    };

    // Calculate immediately
    calculateBabiesBorn();
    
    // Set up interval to recalculate every 10 seconds
    const intervalId = setInterval(calculateBabiesBorn, 10000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [refreshTimestamp]); // Recalculate when dashboard refreshes

  // Format the count with commas
  const formattedCount = new Intl.NumberFormat('en-US').format(babyCount);

  return (
    <Tile size={size}>
      <div className="w-full text-sm text-left">
        <div className="text-xs text-gray-500 mb-1">
          World Population
        </div>
        {formattedCount} babies born today
      </div>
    </Tile>
  );
} 
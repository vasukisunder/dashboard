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
  const [totalBabies, setTotalBabies] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);

  useEffect(() => {
    // Initialize counter with babies born so far today
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const secondsToday = Math.floor((now.getTime() - start.getTime()) / 1000);
    const initialCount = Math.floor(secondsToday * BABIES_PER_SECOND);
    
    setTotalBabies(initialCount);
    setStartTime(Date.now());
    
    // Set up animation frame to update counter continuously
    let animationFrameId: number;
    let lastUpdateTime = Date.now();
    
    const updateCounter = () => {
      const currentTime = Date.now();
      const elapsedSeconds = (currentTime - lastUpdateTime) / 1000;
      
      // Only update if enough time has passed to add at least 1 baby
      if (elapsedSeconds >= 1 / BABIES_PER_SECOND) {
        const newBabies = Math.floor(elapsedSeconds * BABIES_PER_SECOND);
        setTotalBabies(prevCount => prevCount + newBabies);
        lastUpdateTime = currentTime;
      }
      
      animationFrameId = requestAnimationFrame(updateCounter);
    };
    
    // Start the continuous update
    animationFrameId = requestAnimationFrame(updateCounter);
    
    // Clean up animation frame on unmount
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []); // Run once on mount, independent of refreshTimestamp

  // Format the count with commas
  const formattedCount = new Intl.NumberFormat('en-US').format(Math.floor(totalBabies));

  return (
    <Tile size={size}>
      <div className="w-full text-sm text-left">
        <div className="text-xs text-[var(--accent-teal)] mb-1">
          World Population
        </div>
        {formattedCount} babies born today
      </div>
    </Tile>
  );
} 
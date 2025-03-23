'use client';

import { useState, useEffect } from 'react';
import Tile from '../Tile';
import { TileSize } from '../Tile';

interface InternetStatsData {
  dataCreated: string;
  googleSearches: string;
  youtubeHours: string;
  emailsSent: string;
}

interface InternetStatsTileProps {
  size?: TileSize;
  refreshTimestamp?: Date;
}

// Constants for calculations
const BYTES_PER_DAY = 2.5e18; // 2.5 quintillion bytes per day
const GOOGLE_SEARCHES_PER_DAY = 8.5e9; // 8.5 billion searches per day
const YOUTUBE_HOURS_PER_DAY = 1e9; // 1 billion hours per day
const EMAILS_PER_DAY = 333e9; // 333 billion emails per day

export default function InternetStatsTile({ size = "squarish", refreshTimestamp }: InternetStatsTileProps) {
  const [stats, setStats] = useState<InternetStatsData>({
    dataCreated: '0',
    googleSearches: '0',
    youtubeHours: '0',
    emailsSent: '0'
  });
  
  const [currentStat, setCurrentStat] = useState<number>(0);
  
  // Function to calculate stats based on time of day
  const calculateStats = () => {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    
    // Get seconds elapsed since start of day
    const secondsToday = (now.getTime() - startOfDay.getTime()) / 1000;
    const dayProgress = secondsToday / (24 * 60 * 60);
    
    // Calculate stats for today so far
    const dataCreated = BYTES_PER_DAY * dayProgress;
    const googleSearches = GOOGLE_SEARCHES_PER_DAY * dayProgress;
    const youtubeHours = YOUTUBE_HOURS_PER_DAY * dayProgress;
    const emailsSent = EMAILS_PER_DAY * dayProgress;
    
    // Format numbers
    const formatData = (bytes: number) => {
      if (bytes >= 1e18) return `${(bytes / 1e18).toFixed(1)} EB`;
      if (bytes >= 1e15) return `${(bytes / 1e15).toFixed(1)} PB`;
      return `${(bytes / 1e12).toFixed(1)} TB`;
    };
    
    const formatNumber = (num: number) => {
      if (num >= 1e9) return `${(num / 1e9).toFixed(1)} billion`;
      if (num >= 1e6) return `${(num / 1e6).toFixed(1)} million`;
      return `${Math.round(num).toLocaleString()}`;
    };
    
    setStats({
      dataCreated: formatData(dataCreated),
      googleSearches: formatNumber(googleSearches),
      youtubeHours: formatNumber(youtubeHours),
      emailsSent: formatNumber(emailsSent)
    });
  };
  
  useEffect(() => {
    // Calculate immediately on mount
    calculateStats();
    
    // Setup interval to refresh every second
    const interval = setInterval(() => {
      calculateStats();
    }, 1000);
    
    // Setup interval to rotate the displayed stat
    const rotationInterval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % 4);
    }, 5000);
    
    return () => {
      clearInterval(interval);
      clearInterval(rotationInterval);
    };
  }, [refreshTimestamp]);
  
  // Render each stat with its description
  const renderStat = () => {
    switch (currentStat) {
      case 0:
        return (
          <>
            <div>Internet Data Created Today</div>
            <div className="text-2xl mt-2">{stats.dataCreated}</div>
          </>
        );
      case 1:
        return (
          <>
            <div>Google Searches Today</div>
            <div className="text-2xl mt-2">{stats.googleSearches}</div>
          </>
        );
      case 2:
        return (
          <>
            <div>YouTube Hours Watched Today</div>
            <div className="text-2xl mt-2">{stats.youtubeHours}</div>
          </>
        );
      case 3:
        return (
          <>
            <div>Emails Sent Today</div>
            <div className="text-2xl mt-2">{stats.emailsSent}</div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Tile size={size}>
      <div className="w-full text-sm text-left">
        <div className="text-xs text-[var(--accent-teal)] mb-1">
          Internet Statistics
        </div>
        {renderStat()}
      </div>
    </Tile>
  );
} 
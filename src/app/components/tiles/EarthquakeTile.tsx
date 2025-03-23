'use client';

import { useState, useEffect } from 'react';
import Tile from '../Tile';
import { TileSize } from '../Tile';

interface EarthquakeData {
  magnitude: number;
  location: string;
  time: string;
  timeAgo: string;
  url: string;
  error?: string;
}

interface EarthquakeTileProps {
  size?: TileSize;
  refreshTimestamp?: Date;
  uniqueId?: string;
}

export default function EarthquakeTile({ 
  size = "medium", 
  refreshTimestamp,
  uniqueId = Math.random().toString(36).substring(7)
}: EarthquakeTileProps) {
  const [quakeData, setQuakeData] = useState<EarthquakeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEarthquakeData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/earthquake?uniqueId=${uniqueId}&t=${Date.now()}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch earthquake data: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        setQuakeData(data);
      } catch (err) {
        console.error('Error fetching earthquake data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load earthquake data');
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch immediately on mount
    fetchEarthquakeData();
    
    // Set up interval to fetch every 10 seconds
    const interval = setInterval(() => {
      fetchEarthquakeData();
    }, 10000);
    
    // Clean up the interval when the component unmounts
    return () => clearInterval(interval);
  }, [uniqueId]); // Remove refreshTimestamp dependency

  if (isLoading) {
    return (
      <Tile size={size}>
        <div className="w-full text-sm text-left">
          <div className="text-xs text-[var(--accent-teal)] mb-1">
            Recent Earthquake
          </div>
          Loading earthquake data...
        </div>
      </Tile>
    );
  }

  if (error) {
    return (
      <Tile size={size}>
        <div className="w-full text-sm text-left">
          <div className="text-xs text-[var(--accent-teal)] mb-1">
            Recent Earthquake
          </div>
          Unable to load earthquake data
        </div>
      </Tile>
    );
  }

  if (!quakeData) {
    return (
      <Tile size={size}>
        <div className="w-full text-sm text-left">
          <div className="text-xs text-[var(--accent-teal)] mb-1">
            Recent Earthquake
          </div>
          No earthquake data available
        </div>
      </Tile>
    );
  }

  return (
    <Tile size={size}>
      <div className="w-full text-sm text-left">
        <div className="text-xs text-[var(--accent-teal)] mb-1">
          Recent Earthquake
        </div>
        A magnitude {quakeData.magnitude} earthquake was detected {quakeData.location}
        {quakeData.url && (
          <a 
            href={quakeData.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-1 text-xs text-[var(--text-muted)] hover:text-[var(--accent-teal)]"
          >
            View details
          </a>
        )}
      </div>
    </Tile>
  );
}

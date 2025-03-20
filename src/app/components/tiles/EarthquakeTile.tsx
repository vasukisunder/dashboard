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
        
        const response = await fetch(`/api/earthquake?uniqueId=${uniqueId}`);
        
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

    fetchEarthquakeData();
  }, [refreshTimestamp, uniqueId]);

  if (isLoading) {
    return (
      <Tile size={size}>
        <div className="w-full text-sm text-left">
          Loading earthquake data...
        </div>
      </Tile>
    );
  }

  if (error || !quakeData) {
    return (
      <Tile size={size}>
        <div className="w-full text-sm text-left">
          No earthquake data available
          {error && <p className="text-red-500 mt-2 text-xs">{error}</p>}
        </div>
      </Tile>
    );
  }

  return (
    <Tile size={size}>
      <div className="whitespace-pre-line relative w-full text-sm text-left">
        {quakeData.magnitude > 0 ? (
          <div>
            Earthquake {quakeData.location} with a magnitude of {quakeData.magnitude.toFixed(1)} happened {quakeData.timeAgo} →
          </div>
        ) : (
          <div>
            {quakeData.location} →
          </div>
        )}
        {quakeData.url && (
          <a 
            href={quakeData.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="absolute inset-0 z-10"
            aria-label={`View details about earthquake: Magnitude ${quakeData.magnitude.toFixed(1)} ${quakeData.location}`}
          />
        )}
      </div>
    </Tile>
  );
}

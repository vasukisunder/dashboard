'use client';

import { useState, useEffect } from 'react';
import Tile from '../Tile';
import { TileSize } from '../Tile';

interface WikiUpdateData {
  title: string;
  link: string;
  timestamp: string;
  error?: string;
}

interface WikiTileProps {
  size?: TileSize;
  refreshTimestamp?: Date;
  uniqueId?: string;
}

export default function WikiTile({ 
  size = "medium", 
  refreshTimestamp,
  uniqueId = Math.random().toString(36).substring(7)
}: WikiTileProps) {
  const [wikiData, setWikiData] = useState<WikiUpdateData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWikiUpdate = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Construct URL with uniqueId to prevent duplicate results
        const url = `/api/wikipedia?preventDuplicates=true&uniqueId=${uniqueId}&refresh=${!!refreshTimestamp}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch Wikipedia update: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        setWikiData(data);
      } catch (err) {
        console.error('Error fetching Wikipedia update:', err);
        setError(err instanceof Error ? err.message : 'Failed to load Wikipedia update');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWikiUpdate();
  }, [refreshTimestamp, uniqueId]);

  if (isLoading) {
    return (
      <Tile size={size}>
        <div className="w-full text-sm text-left">
          Loading Wikipedia updates...
        </div>
      </Tile>
    );
  }

  if (error || !wikiData) {
    return (
      <Tile size={size}>
        <div className="w-full text-sm text-left">
          No Wikipedia updates available
          {error && <p className="text-red-500 mt-2 text-xs">{error}</p>}
        </div>
      </Tile>
    );
  }

  return (
    <Tile size={size}>
      <div className="whitespace-pre-line relative w-full text-sm text-left">
        <div>
          {wikiData.title} was just updated on Wikipedia →
        </div>
        {wikiData.link && (
          <a 
            href={wikiData.link} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="absolute inset-0 z-10"
            aria-label={`View Wikipedia article: ${wikiData.title}`}
          />
        )}
      </div>
    </Tile>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Tile from '../Tile';
import Image from 'next/image';
import { TileSize } from '../Tile';

interface NewsImageData {
  section: string;
  headline: string;
  source: string;
  sectionName: string;
  photo_url: string | null;
  link: string | null;
  snippet: string | null;
}

interface NewsImageTileProps {
  section?: string;
  size?: TileSize;
  refreshTimestamp?: Date;
  uniqueId?: string;
}

export default function NewsImageTile({ 
  section, 
  size = "squarish", 
  refreshTimestamp,
  uniqueId = Math.random().toString(36).substring(7)
}: NewsImageTileProps) {
  const [newsData, setNewsData] = useState<NewsImageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Construct URL with section param if provided
        let url = section 
          ? `/api/news?section=${section}&preventDuplicates=true` 
          : '/api/news?preventDuplicates=true';
          
        // Add unique ID with more randomness to prevent duplicate results AND ensure each tile gets different content
        // Include section in uniqueId to ensure different sections get different articles
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 10);
        url += `&uniqueId=${uniqueId}-${section || 'random'}-${timestamp}-${randomSuffix}`;

        // Explicitly request a force refresh occasionally
        const shouldForceRefresh = Math.random() > 0.5; // 50% chance to force refresh
        url += `&forceRefresh=${shouldForceRefresh}&t=${timestamp}`;
        
        console.log(`Fetching news for section ${section} with tile ID ${uniqueId} (force refresh: ${shouldForceRefresh})`);
        
        const response = await fetch(url, {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'pragma': 'no-cache',
            'cache-control': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch news: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        console.log(`Received data for section ${section}:`, data.headline);
        setNewsData(data);
      } catch (err) {
        console.error('Error fetching news image:', err);
        setError(err instanceof Error ? err.message : 'Failed to load news image');
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch immediately on mount or when refreshTimestamp changes
    fetchNews();
    
    // Set up interval to fetch periodically (less frequently to avoid API rate limits)
    const interval = setInterval(() => {
      fetchNews();
    }, 40000); // 40 seconds instead of 20 to reduce API calls
    
    // Clean up the interval when the component unmounts
    return () => clearInterval(interval);
  }, [section, uniqueId, refreshTimestamp]); // Include refreshTimestamp in dependencies

  if (isLoading) {
    return (
      <Tile size={size}>
        <div className="w-full text-sm text-left">
          <div className="text-xs text-[var(--accent-teal)] mb-1">
            News Image
          </div>
          Loading news...
        </div>
      </Tile>
    );
  }

  if (error) {
    return (
      <Tile size={size}>
        <div className="w-full text-sm text-left">
          <div className="text-xs text-[var(--accent-teal)] mb-1">
            News Image
          </div>
          Unable to load news: {error}
        </div>
      </Tile>
    );
  }

  if (!newsData || !newsData.photo_url) {
    return (
      <Tile size={size}>
        <div className="w-full text-sm text-left">
          <div className="text-xs text-[var(--accent-teal)] mb-1">
            News Image
          </div>
          No news image available
        </div>
      </Tile>
    );
  }

  return (
    <Tile size={size} className="!p-0 overflow-hidden">
      <div className="relative h-full w-full">
        {/* Using a div with background-image for better control */}
        <div 
          className="absolute inset-0 bg-center bg-cover h-full w-full"
          style={{ backgroundImage: `url(${newsData.photo_url})` }}
        />
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/70">
          <div className="text-xs text-[var(--accent-teal)] mb-1">
            {newsData.section ? `${newsData.section.charAt(0).toUpperCase() + newsData.section.slice(1)} News` : 'News'}
          </div>
          <p className="truncate text-sm text-left text-white">
            {newsData.headline}
          </p>
          {newsData.link && (
            <a 
              href={newsData.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-1 text-xs text-[var(--text-muted)] hover:text-[var(--accent-teal)]"
            >
              Read more
            </a>
          )}
        </div>
      </div>
    </Tile>
  );
} 
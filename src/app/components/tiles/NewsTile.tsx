'use client';

import { useState, useEffect } from 'react';
import Tile from '../Tile';

interface NewsData {
  section: string;
  headline: string;
  source: string;
  sectionName: string;
  link: string | null;
}

interface NewsTileProps {
  section?: string;
  size?: "small" | "medium" | "large" | "wide" | "tall" | "squarish";
  refreshTimestamp?: Date;
}

export default function NewsTile({ section, size = "wide", refreshTimestamp }: NewsTileProps) {
  const [newsData, setNewsData] = useState<NewsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Construct URL with section param if provided
        const url = section 
          ? `/api/news?section=${section}&preventDuplicates=true` 
          : '/api/news?preventDuplicates=true';
        
        // Add extra randomness to ensure different content
        const randomSuffix = Math.random().toString(36).substring(2, 10);
        const uniqueId = `newstile-${Date.now()}-${randomSuffix}`;
        
        // Add unique ID and timestamp to prevent caching
        const finalUrl = `${url}&uniqueId=${uniqueId}&forceRefresh=true&t=${Date.now()}`;
        
        console.log(`Fetching news with URL: ${finalUrl}`);
        
        const response = await fetch(finalUrl, {
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
        
        setNewsData(data);
      } catch (err) {
        console.error('Error fetching news:', err);
        setError(err instanceof Error ? err.message : 'Failed to load news');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, [section, refreshTimestamp]);

  if (isLoading) {
    return (
      <Tile size={size}>
        <div className="w-full text-sm text-left">
          Loading news...
        </div>
      </Tile>
    );
  }

  if (error) {
    return (
      <Tile size={size}>
        <div className="w-full text-sm text-left">
          Unable to load news: {error}
        </div>
      </Tile>
    );
  }

  if (!newsData) {
    return (
      <Tile size={size}>
        <div className="w-full text-sm text-left">
          No news available
        </div>
      </Tile>
    );
  }

  return (
    <Tile size={size}>
      <div className="whitespace-pre-line relative w-full text-sm text-left">
        <div>
          Latest news: {newsData.headline} →
        </div>
        {newsData.link && (
          <a 
            href={newsData.link} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="absolute inset-0 z-10"
            aria-label={`Read more about: ${newsData.headline}`}
          />
        )}
      </div>
    </Tile>
  );
} 
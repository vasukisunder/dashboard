'use client';

import { useState, useEffect } from 'react';
import Tile from '../Tile';
import { TileSize } from '../Tile';

// Define the expected API response structure
interface WikiEvent {
  text: string;
  year: number;
  pages?: {
    content_urls?: {
      desktop?: {
        page?: string;
      };
    };
  }[];
}

interface WikiResponse {
  events?: WikiEvent[];
  births?: WikiEvent[];
  deaths?: WikiEvent[];
}

interface OnThisDayData {
  text: string;
  year: number;
  type: string;
  link?: string;
}

interface OnThisDayTileProps {
  size?: TileSize;
  refreshTimestamp?: Date;
}

export default function OnThisDayTile({ size = "squarish", refreshTimestamp }: OnThisDayTileProps) {
  const [data, setData] = useState<OnThisDayData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOnThisDay = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get today's date
        const today = new Date();
        const month = today.getMonth() + 1; // getMonth() returns 0-11
        const day = today.getDate();

        // Randomly select an event type
        const types = ['events', 'births', 'deaths'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        const url = `https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/${type}/${month}/${day}`;
        
        console.log('Fetching from URL:', url);
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
        }

        const responseData = await response.json();
        console.log('API response type:', type);
        
        if (!responseData[type] || responseData[type].length === 0) {
          throw new Error(`No ${type} found for this day`);
        }
        
        // Randomly select one event from the results
        const items = responseData[type];
        const randomItem = items[Math.floor(Math.random() * items.length)];
        console.log('Selected item:', randomItem);
        
        // Format the text based on the type
        let text = '';
        switch (type) {
          case 'events':
            text = `On this day in ${randomItem.year}, ${randomItem.text}`;
            break;
          case 'births':
            text = `Born on this day in ${randomItem.year}: ${randomItem.text}`;
            break;
          case 'deaths':
            text = `Died on this day in ${randomItem.year}: ${randomItem.text}`;
            break;
        }
        
        setData({
          text,
          year: randomItem.year,
          type,
          link: randomItem.pages && randomItem.pages[0]?.content_urls?.desktop?.page
        });
      } catch (err) {
        console.error('Error fetching historical data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load historical data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOnThisDay();

    // Refresh every 5 minutes
    const interval = setInterval(fetchOnThisDay, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshTimestamp]);

  if (isLoading) {
    return (
      <Tile size={size}>
        <div className="w-full text-sm text-left">
          Loading historical data...
        </div>
      </Tile>
    );
  }

  if (error) {
    return (
      <Tile size={size}>
        <div className="w-full text-sm text-left">
          Unable to load historical data: {error}
        </div>
      </Tile>
    );
  }

  if (!data) {
    return (
      <Tile size={size}>
        <div className="w-full text-sm text-left">
          No historical data available
        </div>
      </Tile>
    );
  }

  return (
    <Tile size={size}>
      <div className="w-full text-sm text-left">
        <div className="text-xs text-gray-500 mb-1">
          {data.type === 'events' ? 'Historical Event' : data.type === 'births' ? 'Born on This Day' : 'Died on This Day'}
        </div>
        {data.text}
        {data.link && (
          <a 
            href={data.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-1 text-xs text-gray-500 hover:text-gray-400"
          >
            Read more
          </a>
        )}
      </div>
    </Tile>
  );
} 
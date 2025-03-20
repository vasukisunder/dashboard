'use client';

import { useState, useEffect } from 'react';
import Tile from '../Tile';
import { TileSize } from '../Tile';

interface BitcoinData {
  price: number;
  changePercent24h: number;
  source?: string;
}

interface BitcoinTileProps {
  size?: TileSize;
  refreshTimestamp?: Date;
  uniqueId?: string;
}

export default function BitcoinTile({ 
  size = 'small', 
  refreshTimestamp,
  uniqueId = Math.random().toString(36).substring(7)
}: BitcoinTileProps) {
  const [bitcoinData, setBitcoinData] = useState<BitcoinData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBitcoinData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('Fetching Bitcoin data...');
        
        // Fetch from our API route with force refresh parameter
        const url = `/api/bitcoin?forceRefresh=true&t=${Date.now()}`;
        const response = await fetch(url, {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          // API returned an error
          const errorMessage = data.error || `Failed to fetch Bitcoin data: ${response.status}`;
          console.error(errorMessage);
          throw new Error(errorMessage);
        }
        
        console.log('Bitcoin data received:', data);
        
        setBitcoinData(data);
      } catch (err) {
        console.error('Error fetching Bitcoin data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load Bitcoin data');
        // No fallback data - we only want real data
      } finally {
        setIsLoading(false);
      }
    };

    fetchBitcoinData();
  }, [refreshTimestamp]);

  if (isLoading) {
    return (
      <Tile size={size}>
        <div className="text-sm text-left whitespace-pre-line">
          Loading Bitcoin data...
        </div>
      </Tile>
    );
  }

  if (error || !bitcoinData) {
    return (
      <Tile size={size}>
        <div className="text-sm text-left whitespace-pre-line">
          Unable to load real Bitcoin data.
          {process.env.NODE_ENV === 'development' && error && (
            <>
              {"\n"}
              Error: {error}
            </>
          )}
        </div>
      </Tile>
    );
  }

  // Format bitcoin price with commas for thousands
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(bitcoinData.price);

  // Create a natural language description
  const getBitcoinText = () => {
    const direction = bitcoinData.changePercent24h >= 0 ? 'up' : 'down';
    let text = `Bitcoin is trading at ${formattedPrice} and is ${direction} ${Math.abs(bitcoinData.changePercent24h).toFixed(1)}% today.`;
    
  
    
    return text;
  };

  return (
    <Tile size={size}>
      <div className="w-full text-sm text-left">
        <div className="text-xs text-gray-500 mb-1">
          Bitcoin Price
        </div>
        BTC: ${bitcoinData.price.toLocaleString()}
        <div className="text-xs mt-1">
          {bitcoinData.changePercent24h >= 0 ? '↑' : '↓'} {Math.abs(bitcoinData.changePercent24h).toFixed(2)}% today
        </div>
        <a 
          href="https://coinmarketcap.com/currencies/bitcoin/"
          target="_blank"
          rel="noopener noreferrer"
          className="block mt-1 text-xs text-gray-500 hover:text-gray-400"
        >
          View chart
        </a>
      </div>
    </Tile>
  );
} 
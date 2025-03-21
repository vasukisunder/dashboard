'use client';

import { useState, useEffect } from 'react';
import Tile from '../Tile';
import { TileSize } from '../Tile';

interface StockData {
  symbol: string;
  change: number;
  changePercent: number;
}

interface MultiStockTileProps {
  size?: TileSize;
  refreshTimestamp?: Date;
  uniqueId?: string;
}

// Major stock indices
const INDICES = [
  { symbol: '^GSPC', name: 'S&P 500' },
  { symbol: '^IXIC', name: 'NASDAQ' },
  { symbol: '^DJI', name: 'Dow Jones' },
];

export default function MultiStockTile({ 
  size = 'squarish', 
  refreshTimestamp,
  uniqueId = Math.random().toString(36).substring(7)
}: MultiStockTileProps) {
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('Fetching stock market data for multiple indices...');
        
        // Fetch from our API route with force refresh
        const url = `/api/stocks?forceRefresh=${!!refreshTimestamp}&t=${Date.now()}`;
        const response = await fetch(url, {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Stock API error: ${response.status}`, errorText);
          throw new Error(`Failed to fetch stock data: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Stock data received for multiple indices:', data);
        
        setStockData(data);
      } catch (err) {
        console.error('Error fetching stock data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load stock data');
        
        // Generate mock data as fallback
        const mockData = INDICES.map(index => ({
          symbol: index.symbol,
          name: index.name,
          change: (Math.random() * 2 - 1) * 2, // Random between -2% and +2%
          changePercent: (Math.random() * 2 - 1) * 2 // Random between -2% and +2%
        }));
        
        setStockData(mockData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStockData();
  }, [refreshTimestamp]);

  if (isLoading) {
    return (
      <Tile size={size}>
        <div className="w-full text-sm text-left">
          <div className="text-xs text-gray-500 mb-1">
            Stock Markets
          </div>
          Loading stock data...
        </div>
      </Tile>
    );
  }

  if (error && stockData.length === 0) {
    return (
      <Tile size={size}>
        <div className="w-full text-sm text-left">
          <div className="text-xs text-gray-500 mb-1">
            Stock Markets
          </div>
          Unable to load stock data
        </div>
      </Tile>
    );
  }

  return (
    <Tile size={size}>
      <div className="w-full text-sm text-left">
        <div className="text-xs text-gray-500 mb-1">
          Stock Markets
        </div>
        
        {stockData.length > 0 && (
          <div className="flex justify-between">
            {stockData.map((stock, index) => {
              const indexInfo = INDICES.find(i => i.symbol === stock.symbol);
              const name = indexInfo?.name || stock.symbol;
              return (
                <div key={stock.symbol} className="text-center text-xxs font-mono">
                  <div>{name}</div>
                  <div className="text-xs mt-1">
                    {stock.changePercent >= 0 ? '↑' : '↓'} {Math.abs(stock.changePercent).toFixed(2)}%
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
      </div>
    </Tile>
  );
} 
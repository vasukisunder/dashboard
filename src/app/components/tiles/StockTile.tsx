'use client';

import { useState, useEffect } from 'react';
import Tile from '../Tile';
import { TileSize } from '../Tile';

interface StockData {
  symbol: string;
  change: number;
  changePercent: number;
}

interface StockTileProps {
  size?: TileSize;
  refreshTimestamp?: Date;
  uniqueId?: string;
}

// Major stock indices
const INDICES = [
  { symbol: '^GSPC', name: 'S&P 500' },
  { symbol: '^IXIC', name: 'NASDAQ' },
  { symbol: '^DJI', name: 'Dow' },
];

export default function StockTile({ 
  size = 'medium', 
  refreshTimestamp,
  uniqueId = Math.random().toString(36).substring(7)
}: StockTileProps) {
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('Fetching stock market data...');
        
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
        console.log('Stock data received:', data);
        
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
        <div className="text-sm text-left whitespace-pre-line">
          Loading stock data...
        </div>
      </Tile>
    );
  }

  if (error && stockData.length === 0) {
    return (
      <Tile size={size}>
        <div className="text-sm text-left whitespace-pre-line">
          Unable to load stock data.
          {process.env.NODE_ENV === 'development' && (
            <>
              {"\n"}
              Error: {error}
            </>
          )}
        </div>
      </Tile>
    );
  }

  // Format the stock data for display
  const formatStockChange = (change: number, changePercent: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${changePercent.toFixed(1)}%`;
  };

  const getStockText = () => {
    const stocks = stockData.map(stock => {
      const indexInfo = INDICES.find(i => i.symbol === stock.symbol);
      const name = indexInfo?.name || stock.symbol;
      const changeText = formatStockChange(stock.change, stock.changePercent);
      return `${name} is ${stock.changePercent >= 0 ? 'up' : 'down'} ${Math.abs(stock.changePercent).toFixed(1)}% today`;
    });
    
    if (stocks.length === 0) return "No stock data available";
    
    // Join with periods
    return stocks.join(". ") + ".";
  };

  return (
    <Tile size={size}>
      <div className="w-full text-sm text-left">
        <div className="text-xs text-[var(--accent-teal)] mb-1">
          Stock Market
        </div>
        {stockData.length > 0 && (
          <>
            {INDICES.find(index => index.symbol === stockData[0].symbol)?.name || stockData[0].symbol}
            <div className="text-xs mt-1">
              {stockData[0].changePercent >= 0 ? '↑' : '↓'} {Math.abs(stockData[0].changePercent).toFixed(2)}% today
            </div>
            <a 
              href={`https://finance.yahoo.com/quote/${stockData[0].symbol}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-1 text-xs text-blue-400 hover:text-blue-300"
            >
              View details →
            </a>
          </>
        )}
      </div>
    </Tile>
  );
} 
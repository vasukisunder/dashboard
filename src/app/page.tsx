'use client';

import Clock from './components/Clock';
import Dashboard from './components/Dashboard';
import Tile from './components/Tile';
import MasonryLayout from './components/MasonryLayout';
import { useCallback, useState } from 'react';
import { TileSize } from './components/Tile';

type TileData = {
  id: number;
  title: string;
  size: TileSize;
  content: string;
};

export default function Home() {
  const [refreshTimestamp, setRefreshTimestamp] = useState(new Date());
  
  const handleRefresh = useCallback(() => {
    setRefreshTimestamp(new Date());
    console.log('Dashboard refreshed at', new Date().toLocaleTimeString());
  }, []);

  // Sample tiles with different sizes
  const tiles: TileData[] = [
    { id: 1, title: 'Weather', size: 'medium', content: 'Current weather in Tokyo: 22°C, Partly Cloudy' },
    { id: 13, title: 'Time Zone', size: 'medium', content: 'Current UTC Offset: -07:00' },
    { id: 2, title: 'News Headline', size: 'wide', content: 'Scientists Discover New Species in the Deep Ocean' },
    { id: 3, title: 'Moon Phase', size: 'small', content: 'Waxing Gibbous (78% illumination)' },
    { id: 4, title: 'Latest Earthquake', size: 'medium', content: 'Magnitude 4.7 - Off the coast of Chile' },
    { id: 5, title: 'Air Quality', size: 'small', content: 'Paris: Good (AQI: 42)' },
    { id: 6, title: 'Currency Exchange', size: 'medium', content: '1 USD = 0.91 EUR' },
    { id: 7, title: 'Space Station', size: 'wide', content: 'ISS is currently over Pacific Ocean' },
    { id: 8, title: 'Random Fact', size: 'small', content: 'The shortest war in history lasted 38 minutes' },
    { id: 9, title: 'Stock Market', size: 'tall', content: 'S&P 500: +0.8%, NASDAQ: +1.2%, Dow: +0.5%' },
    { id: 10, title: 'Word of the Day', size: 'small', content: 'Ephemeral - lasting for a very short time' },
    { id: 11, title: 'Top Song', size: 'medium', content: '#1 on Global Charts: "Example Song" by Artist' },
    { id: 12, title: 'Asteroid Watch', size: 'large', content: 'Nearest asteroid: 2023 DW at 3.1 million km from Earth' },
    { id: 14, title: 'Population', size: 'small', content: 'World Population: 7.9 billion' },
    { id: 15, title: 'Ocean Tides', size: 'small', content: 'Current tide: Rising (2.1m)' }
  ];

  return (
    <Dashboard refreshInterval={60000} onRefresh={handleRefresh}>
      <MasonryLayout>
        <Clock />
        {tiles.map(tile => (
          <Tile 
            key={tile.id} 
            title={tile.title} 
            size={tile.size}
          >
            <p className="text-center">{tile.content}</p>
          </Tile>
        ))}
      </MasonryLayout>
    </Dashboard>
  );
}

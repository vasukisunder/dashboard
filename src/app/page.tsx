'use client';

import Clock from './components/Clock';
import Dashboard from './components/Dashboard';
import Tile from './components/Tile';
import MasonryLayout from './components/MasonryLayout';
import NewsTile from './components/tiles/NewsTile';
import WeatherTile from './components/tiles/WeatherTile';
import NewsImageTile from './components/tiles/NewsImageTile';
import WikiTile from './components/tiles/WikiTile';
import EarthquakeTile from './components/tiles/EarthquakeTile';
import StockTile from './components/tiles/StockTile';
import BitcoinTile from './components/tiles/BitcoinTile';
import BabyCounterTile from './components/tiles/BabyCounterTile';
import ISSTile from './components/tiles/ISSTile';
import OnThisDayTile from './components/tiles/OnThisDayTile';
import MultiStockTile from './components/tiles/MultiStockTile';
import InternetStatsTile from './components/tiles/InternetStatsTile';
import EnvironmentalImpactTile from './components/tiles/EnvironmentalImpactTile';
import { useCallback, useState, useEffect } from 'react';
import { TileSize } from './components/Tile';
import IntroScreen from './components/IntroScreen';

type TileData = {
  id: number;
  size: TileSize;
  content: string;
};

export default function Home() {
  const [refreshTimestamp, setRefreshTimestamp] = useState(new Date());
  const [showIntro, setShowIntro] = useState(true);
  
  const handleRefresh = useCallback(() => {
    setRefreshTimestamp(new Date());
    console.log('Dashboard refreshed at', new Date().toLocaleTimeString());
  }, []);

  const handleEnterDashboard = () => {
    setShowIntro(false);
  };

  const handleReturnToIntro = () => {
    setShowIntro(true);
  };

  if (showIntro) {
    return (
      <IntroScreen 
        onEnter={handleEnterDashboard} 
        backgroundImage="/macro.png"
      />
    );
  }

  return (
    <main className="min-h-screen">
      <Dashboard refreshInterval={60000} onRefresh={handleRefresh}>
        <MasonryLayout>
          <Clock onClickImage={handleReturnToIntro} />
          
          {/* First weather tile */}
          <WeatherTile 
            size="medium" 
            refreshTimestamp={refreshTimestamp}
            uniqueId="weather1" 
          />
          
          <ISSTile size="squarish" refreshTimestamp={refreshTimestamp} />
          
          {/* News tiles with various NYT sections */}
          <NewsImageTile 
            size="squarish" 
            refreshTimestamp={refreshTimestamp} 
            uniqueId="tile1" 
            section="technology"
          />
          
          {/* Earthquake tile */}
          <EarthquakeTile 
            size="squarish" 
            refreshTimestamp={refreshTimestamp}
            uniqueId="earthquake1"
          />
          
          <NewsImageTile 
            size="squarish" 
            refreshTimestamp={refreshTimestamp} 
            uniqueId="tile2" 
            section="science"
          />
          
          <WikiTile 
            size="squarish" 
            refreshTimestamp={refreshTimestamp}
            uniqueId="wiki2"
          />

          {/* First Wikipedia tile */}
          <WikiTile 
            size="squarish" 
            refreshTimestamp={refreshTimestamp}
            uniqueId="wiki1"
          />

          <NewsTile 
            size="wide" 
            refreshTimestamp={refreshTimestamp} 
            section="business"
          />
          
          <WeatherTile 
            size="small" 
            refreshTimestamp={refreshTimestamp} 
            uniqueId="weather3"
          />
          
          <EnvironmentalImpactTile 
            size="squarish" 
            refreshTimestamp={refreshTimestamp}
          />
          
          {/* Second weather tile */}
          <WeatherTile 
            size="medium" 
            refreshTimestamp={refreshTimestamp} 
            uniqueId="weather2"
          />
          
          <OnThisDayTile 
            size="squarish" 
            refreshTimestamp={refreshTimestamp}
          />
          
          {/* Second Wikipedia tile */}
         
          <MultiStockTile 
            size="small" 
            refreshTimestamp={refreshTimestamp}
            uniqueId="multistocks1"
          />
          
          <NewsImageTile 
            size="squarish" 
            refreshTimestamp={refreshTimestamp} 
            uniqueId="tile4" 
            section="travel"
          />

          <BitcoinTile 
            size="squarish" 
            refreshTimestamp={refreshTimestamp} 
            uniqueId="bitcoin1"
          />

          <NewsImageTile 
            size="squarish" 
            refreshTimestamp={refreshTimestamp} 
            uniqueId="tile3" 
            section="arts"
          />

          <BabyCounterTile 
            size="small" 
            refreshTimestamp={refreshTimestamp}
          />
          
          <NewsTile 
            size="wide" 
            refreshTimestamp={refreshTimestamp} 
            section="world"
          />
          
          <InternetStatsTile 
            size="squarish" 
            refreshTimestamp={refreshTimestamp}
          />
          
          <WeatherTile 
            size="small" 
            refreshTimestamp={refreshTimestamp} 
            uniqueId="weather4"
          />
          
        </MasonryLayout>
      </Dashboard>
    </main>
  );
}

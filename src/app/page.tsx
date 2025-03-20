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
import { useCallback, useState } from 'react';
import { TileSize } from './components/Tile';

type TileData = {
  id: number;
  size: TileSize;
  content: string;
};

export default function Home() {
  const [refreshTimestamp, setRefreshTimestamp] = useState(new Date());
  
  const handleRefresh = useCallback(() => {
    setRefreshTimestamp(new Date());
    console.log('Dashboard refreshed at', new Date().toLocaleTimeString());
  }, []);

  return (
    <Dashboard refreshInterval={60000} onRefresh={handleRefresh}>
      <MasonryLayout>
        <Clock />
        
        {/* First weather tile */}
        <WeatherTile 
          size="medium" 
          refreshTimestamp={refreshTimestamp}
          uniqueId="weather1" 
        />
        
        <ISSTile size="medium" refreshTimestamp={refreshTimestamp} />
        
        {/* News tiles with various NYT sections */}
        <NewsImageTile 
          size="squarish" 
          refreshTimestamp={refreshTimestamp} 
          uniqueId="tile1" 
          section="technology"
        />
        
        {/* Earthquake tile */}
        <EarthquakeTile 
          size="medium" 
          refreshTimestamp={refreshTimestamp}
          uniqueId="earthquake1"
        />
        
        <NewsImageTile 
          size="squarish" 
          refreshTimestamp={refreshTimestamp} 
          uniqueId="tile2" 
          section="science"
        />
        
        <StockTile 
          size="medium" 
          refreshTimestamp={refreshTimestamp} 
          uniqueId="stocks1"
        />

        <NewsTile 
          size="wide" 
          refreshTimestamp={refreshTimestamp} 
          section="business"
        />

        {/* First Wikipedia tile */}
        <WikiTile 
          size="medium" 
          refreshTimestamp={refreshTimestamp}
          uniqueId="wiki1"
        />
        
        <Tile size="small">
          <div className="text-center whitespace-pre-line">The shortest war in history lasted 38 minutes</div>
        </Tile>

        <Tile size="squarish">
          <div className="text-center whitespace-pre-line">CO2 Levels{"\n"}{"\n"}418 ppm{"\n"}{"\n"}+2.3 ppm from last year</div>
        </Tile>
        
        {/* Second weather tile */}
        <WeatherTile 
          size="medium" 
          refreshTimestamp={refreshTimestamp} 
          uniqueId="weather2"
        />
        
        <Tile size="squarish">
          <div className="text-center whitespace-pre-line">#1 on Global Charts: "Example Song" by Artist</div>
        </Tile>
        
        <OnThisDayTile 
          size="squarish" 
          refreshTimestamp={refreshTimestamp}
        />
        
        <NewsImageTile 
          size="squarish" 
          refreshTimestamp={refreshTimestamp} 
          uniqueId="tile3" 
          section="arts"
        />
        
        {/* Second Wikipedia tile */}
        <WikiTile 
          size="small" 
          refreshTimestamp={refreshTimestamp}
          uniqueId="wiki2"
        />
        
        <NewsImageTile 
          size="squarish" 
          refreshTimestamp={refreshTimestamp} 
          uniqueId="tile4" 
          section="travel"
        />

        <BitcoinTile 
          size="small" 
          refreshTimestamp={refreshTimestamp} 
          uniqueId="bitcoin1"
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

        <MultiStockTile 
          size="squarish" 
          refreshTimestamp={refreshTimestamp}
          uniqueId="multistocks1"
        />
      </MasonryLayout>
    </Dashboard>
  );
}

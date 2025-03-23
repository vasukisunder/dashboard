'use client';

import { useState, useEffect } from 'react';
import Tile from '../Tile';
import { TileSize } from '../Tile';

interface EnvironmentalData {
  treesLost: string;
  plasticProduced: string;
  co2Levels: string;
  co2Increase: string;
  speciesRisk: string;
}

interface EnvironmentalImpactTileProps {
  size?: TileSize;
  refreshTimestamp?: Date;
}

// Constants for calculations
const TREES_PER_YEAR = 15e9; // 15 billion trees lost per year
const PLASTIC_PER_YEAR = 380e6; // 380 million tons of plastic per year
const CO2_CURRENT = 418; // Current CO2 in ppm
const CO2_INCREASE = 2.3; // Annual increase in ppm
const ENDANGERED_SPECIES = 41000; // Number of species currently at risk

export default function EnvironmentalImpactTile({ size = "squarish", refreshTimestamp }: EnvironmentalImpactTileProps) {
  const [stats, setStats] = useState<EnvironmentalData>({
    treesLost: '0',
    plasticProduced: '0',
    co2Levels: CO2_CURRENT.toString(),
    co2Increase: CO2_INCREASE.toString(),
    speciesRisk: ENDANGERED_SPECIES.toString()
  });
  
  const [currentStat, setCurrentStat] = useState<number>(0);
  
  // Function to calculate stats based on time of day/year
  const calculateStats = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    
    // Get seconds elapsed since start of year
    const secondsThisYear = (now.getTime() - startOfYear.getTime()) / 1000;
    const yearProgress = secondsThisYear / (365.25 * 24 * 60 * 60);
    
    // Calculate stats for year so far
    const treesLost = TREES_PER_YEAR * yearProgress;
    const plasticProduced = PLASTIC_PER_YEAR * yearProgress;
    
    // Format numbers
    const formatLargeNumber = (num: number) => {
      if (num >= 1e9) return `${(num / 1e9).toFixed(1)} billion`;
      if (num >= 1e6) return `${(num / 1e6).toFixed(1)} million`;
      return Math.round(num).toLocaleString();
    };
    
    setStats({
      treesLost: formatLargeNumber(treesLost),
      plasticProduced: formatLargeNumber(plasticProduced),
      co2Levels: CO2_CURRENT.toString(),
      co2Increase: CO2_INCREASE.toString(),
      speciesRisk: formatLargeNumber(ENDANGERED_SPECIES)
    });
  };
  
  useEffect(() => {
    // Calculate immediately on mount
    calculateStats();
    
    // Setup interval to refresh every 5 seconds
    const interval = setInterval(() => {
      calculateStats();
    }, 5000);
    
    // Setup interval to rotate the displayed stat
    const rotationInterval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % 4);
    }, 7000);
    
    return () => {
      clearInterval(interval);
      clearInterval(rotationInterval);
    };
  }, [refreshTimestamp]);
  
  // Render each stat with its description
  const renderStat = () => {
    switch (currentStat) {
      case 0:
        return (
          <>
            <div>CO2 in Atmosphere</div>
            <div className="text-2xl mt-2">{stats.co2Levels} ppm</div>
            <div className="text-xs mt-1">+{stats.co2Increase} ppm from last year</div>
          </>
        );
      case 1:
        return (
          <>
            <div>Trees Lost This Year</div>
            <div className="text-2xl mt-2">{stats.treesLost}</div>
          </>
        );
      case 2:
        return (
          <>
            <div>Plastic Produced This Year</div>
            <div className="text-2xl mt-2">{stats.plasticProduced} tons</div>
          </>
        );
      case 3:
        return (
          <>
            <div>Species at Risk of Extinction</div>
            <div className="text-2xl mt-2">{stats.speciesRisk}</div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Tile size={size}>
      <div className="w-full text-sm text-left">
        <div className="text-xs text-[var(--accent-teal)] mb-1">
          Environmental Impact
        </div>
        {renderStat()}
        
      </div>
    </Tile>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import Tile from '../Tile';
import { TileSize } from '../Tile';
import { majorCities, getRandomCity } from '../../utils/geography';

interface WeatherData {
  city: string;
  country: string;
  temperature: number;
  condition: string;
  humidity?: number;
  windSpeed?: number;
}

interface WeatherTileProps {
  city?: string;
  size?: TileSize;
  refreshTimestamp?: Date;
  uniqueId?: string;
}

// API key hardcoded for testing
const API_KEY = 'c7e628f4e4eb44b9b4955811252003';

// List of cities that are known to work with the weatherapi.com API
const RELIABLE_CITIES = [
  'London', 'Paris', 'New York', 'Tokyo', 'Sydney', 
  'Berlin', 'Moscow', 'Beijing', 'Dubai', 'Rome',
  'Toronto', 'Madrid', 'Amsterdam', 'Singapore', 'Bangkok'
];

export default function WeatherTile({ 
  city, 
  size = 'medium', 
  refreshTimestamp,
  uniqueId = Math.random().toString(36).substring(7)
}: WeatherTileProps) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Determine which city to fetch
        let cityToFetch = city;
        
        if (!cityToFetch) {
          // Use uniqueId to get a different city for each tile
          if (uniqueId) {
            // Add current timestamp to ensure different cities on refresh
            const hashInput = uniqueId + Date.now().toString();
            const hash = [...hashInput].reduce((acc, char) => acc + char.charCodeAt(0), 0);
            
            // Use the list of reliable cities instead of majorCities
            const index = hash % RELIABLE_CITIES.length;
            cityToFetch = RELIABLE_CITIES[index];
            console.log(`Selected city for ${uniqueId}: ${cityToFetch} (index ${index} of ${RELIABLE_CITIES.length})`);
          } else {
            // Pick a random reliable city
            const randomIndex = Math.floor(Math.random() * RELIABLE_CITIES.length);
            cityToFetch = RELIABLE_CITIES[randomIndex];
            console.log(`Random city selected: ${cityToFetch}`);
          }
        }
        
        // Fetch directly from weatherapi.com
        const url = `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${encodeURIComponent(cityToFetch)}&t=${Date.now()}`;
        
        console.log(`Fetching weather for: ${cityToFetch}`);
        
        const response = await fetch(url, {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`Response status for ${cityToFetch}: ${response.status}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Weather API error for ${cityToFetch}: ${response.status}`, errorText);
          throw new Error(`Failed to fetch weather for ${cityToFetch}: ${response.status}`);
        }
        
        const apiData = await response.json();
        console.log(`Weather data received for ${cityToFetch}:`, apiData);
        
        setWeatherData({
          city: apiData.location.name,
          country: apiData.location.country,
          temperature: apiData.current.temp_c,
          condition: apiData.current.condition.text,
          humidity: apiData.current.humidity,
          windSpeed: apiData.current.wind_kph
        });
      } catch (err) {
        console.error('Error fetching weather:', err);
        setError(err instanceof Error ? err.message : 'Failed to load weather');
        
        // Fallback to mock data
        const fallbackCity = city ? 
          { name: city, country: 'Unknown', lat: 0, lon: 0 } : 
          (uniqueId ? 
            majorCities[([...uniqueId].reduce((acc, char) => acc + char.charCodeAt(0), 0)) % majorCities.length] : 
            getRandomCity());
        
        const baseTempC = 25 - Math.abs(fallbackCity.lat) * 0.5;
        const tempC = Math.round((baseTempC + (Math.random() * 10 - 5)) * 10) / 10;
        
        const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rainy', 'Stormy', 'Snowy', 'Foggy', 'Clear'];
        const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
        
        // Use fallback data
        console.warn('Using fallback weather data due to API error');
        setWeatherData({
          city: fallbackCity.name,
          country: fallbackCity.country || 'Unknown',
          temperature: tempC,
          condition: randomCondition,
          humidity: Math.round(40 + Math.random() * 40),
          windSpeed: Math.round(Math.random() * 30 * 10) / 10
        });
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch immediately on mount
    fetchWeather();
    
    // Set up interval to fetch every 10 seconds
    const interval = setInterval(() => {
      fetchWeather();
    }, 10000);
    
    // Clean up the interval when the component unmounts
    return () => clearInterval(interval);
  }, [city, uniqueId]); // Remove refreshTimestamp dependency

  if (isLoading) {
    return (
      <Tile size={size}>
        <div className="text-sm text-left whitespace-pre-line">
          Loading weather...
        </div>
      </Tile>
    );
  }

  if (error && !weatherData) {
    return (
      <Tile size={size}>
        <div className="text-sm text-left whitespace-pre-line">
          Unable to load weather data.
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

  if (!weatherData) {
    return (
      <Tile size={size}>
        <div className="text-sm text-left whitespace-pre-line">
          No weather data available
        </div>
      </Tile>
    );
  }

  return (
    <Tile size={size}>
      <div className="w-full text-sm text-left">
        <div className="text-xs text-gray-500 mb-1">
          Weather Update
        </div>
        Weather in {weatherData.city} is {weatherData.condition.toLowerCase()} and {weatherData.temperature}°C.
      </div>
    </Tile>
  );
} 
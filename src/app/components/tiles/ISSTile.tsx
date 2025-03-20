'use client';

import { useState, useEffect } from 'react';
import Tile from '../Tile';
import { TileSize } from '../Tile';

interface ISSData {
  message: string;
  timestamp: number;
  iss_position: {
    latitude: string;
    longitude: string;
  };
}

interface GeocodingData {
  display_name: string;
  address: {
    country?: string;
    state?: string;
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    road?: string;
    neighbourhood?: string;
    country_code?: string;
  };
}

interface GeocodingError {
  error: string;
  coordinates?: {
    lat: string;
    lon: string;
  };
}

interface ISSTileProps {
  size?: TileSize;
  refreshTimestamp?: Date;
}

export default function ISSTile({ size = "squarish", refreshTimestamp }: ISSTileProps) {
  const [issData, setIssData] = useState<ISSData | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchISSLocation = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch ISS location
        const response = await fetch('http://api.open-notify.org/iss-now.json', {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch ISS location: ${response.status}`);
        }
        
        const data: ISSData = await response.json();
        
        if (data.message !== 'success') {
          throw new Error('Invalid ISS data received');
        }
        
        setIssData(data);

        // Fetch location name using our proxy API
        const { latitude, longitude } = data.iss_position;
        console.log('Fetching location for coordinates:', latitude, longitude);
        
        const geocodeResponse = await fetch(
          `/api/geocode?lat=${latitude}&lon=${longitude}`,
          {
            headers: {
              'Accept': 'application/json'
            }
          }
        );

        const geocodeData = await geocodeResponse.json();
        
        // Check if we got an error response
        if ('error' in geocodeData) {
          const errorData = geocodeData as GeocodingError;
          console.log('Geocoding error:', errorData);
          
          // Format coordinates for display
          const lat = parseFloat(latitude);
          const lon = parseFloat(longitude);
          const latDir = lat >= 0 ? 'N' : 'S';
          const lonDir = lon >= 0 ? 'E' : 'W';
          const locationName = `${Math.abs(lat).toFixed(2)}°${latDir}, ${Math.abs(lon).toFixed(2)}°${lonDir}`;
          
          setLocation(locationName);
          return;
        }

        // Log the full response for debugging
        console.log('Full geocoding response:', JSON.stringify(geocodeData, null, 2));

        // Determine the location name based on what's available
        let locationName = '';
        
        // First try to get the city and country
        if (geocodeData.address?.city && geocodeData.address?.country) {
          locationName = `${geocodeData.address.city}, ${geocodeData.address.country}`;
        }
        // If no city, try state and country
        else if (geocodeData.address?.state && geocodeData.address?.country) {
          locationName = `${geocodeData.address.state}, ${geocodeData.address.country}`;
        }
        // If no state, just use the country
        else if (geocodeData.address?.country) {
          locationName = geocodeData.address.country;
        }
        // If no country, try city
        else if (geocodeData.address?.city) {
          locationName = geocodeData.address.city;
        }
        // If no city, try state
        else if (geocodeData.address?.state) {
          locationName = geocodeData.address.state;
        }
        // If no specific location, use the display name
        else if (geocodeData.display_name) {
          // Split by comma and take the first part that's not empty
          const parts = geocodeData.display_name.split(',').map((part: string) => part.trim()).filter((part: string) => part);
          locationName = parts[0] || 'Unknown location';
        }
        // If we still don't have a location, use the coordinates
        else {
          const lat = parseFloat(latitude);
          const lon = parseFloat(longitude);
          const latDir = lat >= 0 ? 'N' : 'S';
          const lonDir = lon >= 0 ? 'E' : 'W';
          locationName = `${Math.abs(lat).toFixed(2)}°${latDir}, ${Math.abs(lon).toFixed(2)}°${lonDir}`;
        }
        
        console.log('Selected location name:', locationName);
        setLocation(locationName);
      } catch (err) {
        console.error('Error fetching ISS location:', err);
        setError(err instanceof Error ? err.message : 'Failed to load ISS location');
      } finally {
        setIsLoading(false);
      }
    };

    fetchISSLocation();
    // Refresh every 30 seconds
    const interval = setInterval(fetchISSLocation, 30000);
    return () => clearInterval(interval);
  }, [refreshTimestamp]);

  if (isLoading) {
    return (
      <Tile size={size}>
        <div className="w-full text-sm text-left">
          Loading ISS location...
        </div>
      </Tile>
    );
  }

  if (error) {
    return (
      <Tile size={size}>
        <div className="w-full text-sm text-left">
          Unable to load ISS location: {error}
        </div>
      </Tile>
    );
  }

  if (!issData || !location) {
    return (
      <Tile size={size}>
        <div className="w-full text-sm text-left">
          No ISS location data available
        </div>
      </Tile>
    );
  }

  // Convert timestamp to readable time
  const time = new Date(issData.timestamp * 1000).toLocaleTimeString();

  return (
    <Tile size={size}>
      <div className="w-full text-sm text-left">
        <div className="text-xs text-gray-500 mb-1">
          ISS Location
        </div>
        The ISS is currently flying over {location}
        <a 
          href="https://spotthestation.nasa.gov/tracking_map.cfm"
          target="_blank"
          rel="noopener noreferrer"
          className="block mt-1 text-xs text-gray-500 hover:text-gray-400"
        >
          View tracker
        </a>
      </div>
    </Tile>
  );
} 
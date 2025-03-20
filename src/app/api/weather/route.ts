import { NextResponse } from 'next/server';
import { majorCities, getRandomCity } from '../../utils/geography';

// Cache weather data to avoid hitting API limits
let weatherCache: {
  [cityId: string]: {
    data: any;
    timestamp: number;
  }
} = {};

// Cache expiry in minutes
const CACHE_EXPIRY = 30;

// Hardcoded API key for testing
const API_KEY = 'c7e628f4e4eb44b9b4955811252003';

export async function GET(request: Request) {
  try {
    // Get city from query params or select random city
    const { searchParams } = new URL(request.url);
    const cityName = searchParams.get('city');
    const uniqueId = searchParams.get('uniqueId');
    
    let city;
    if (cityName) {
      city = majorCities.find(c => 
        c.name.toLowerCase() === cityName.toLowerCase()
      );
    }
    
    // If no valid city was provided, get a random one
    // Use uniqueId for seeded randomness if provided
    if (!city) {
      if (uniqueId) {
        // Use uniqueId to create a deterministic index for each tile
        const hash = [...uniqueId].reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const index = hash % majorCities.length;
        city = majorCities[index];
      } else {
        city = getRandomCity();
      }
    } 
    
    const cityId = `${city.name},${city.country}`;
    
    // Check cache
    const now = Date.now();
    if (
      weatherCache[cityId] && 
      (now - weatherCache[cityId].timestamp) < CACHE_EXPIRY * 60 * 1000
    ) {
      return NextResponse.json(weatherCache[cityId].data);
    }

    // Use direct API key from environment variable or hardcoded value
    const apiKey = API_KEY;
    
    // Just use the city name
    const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(city.name)}`;
    
    console.log('Fetching weather for:', city.name);
    
    const response = await fetch(url, { 
      method: 'GET',
      cache: 'no-store',
      next: { revalidate: 0 },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Weather API error (${response.status}):`, errorText);
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const apiData = await response.json();
    
    // Transform the weatherapi.com response to match our WeatherData interface
    const weatherData = {
      city: apiData.location.name,
      country: apiData.location.country,
      temperature: apiData.current.temp_c,
      condition: apiData.current.condition.text,
      humidity: apiData.current.humidity,
      windSpeed: apiData.current.wind_kph
    };
    
    // Store in cache
    weatherCache[cityId] = {
      data: weatherData,
      timestamp: now
    };
    
    return NextResponse.json(weatherData);
  } catch (error) {
    console.error('Weather API error:', error);
    
    // Fallback to mock data if API fails
    const { searchParams } = new URL(request.url);
    const cityParam = searchParams.get('city');
    
    let fallbackCity;
    if (cityParam) {
      fallbackCity = majorCities.find(c => 
        c.name.toLowerCase() === cityParam.toLowerCase()
      );
    }
    
    // If no valid city was provided, get a random one
    if (!fallbackCity) {
      fallbackCity = getRandomCity();
    }
    
    const baseTempC = 25 - Math.abs(fallbackCity.lat) * 0.5;
    const tempC = Math.round((baseTempC + (Math.random() * 10 - 5)) * 10) / 10;
    
    const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rainy', 'Stormy', 'Snowy', 'Foggy', 'Clear'];
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
    
    const fallbackData = {
      city: fallbackCity.name,
      country: fallbackCity.country,
      temperature: tempC,
      condition: randomCondition,
      humidity: Math.round(40 + Math.random() * 40),
      windSpeed: Math.round(Math.random() * 30 * 10) / 10
    };
    
    // Include a note that this is fallback data
    console.warn('Using fallback weather data due to API error');
    
    return NextResponse.json(fallbackData);
  }
} 
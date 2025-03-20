import { NextResponse } from 'next/server';

// Cache expiry in minutes
const CACHE_EXPIRY = 1;
let earthquakeCache: {
  data: {
    magnitude: number;
    location: string;
    time: string;
    timeAgo: string;
    url: string;
  } | null;
  timestamp: number;
} | null = null;

// Keep track of recently shown earthquakes to avoid repeats
const recentlyShownQuakes = new Set<string>();
const MAX_STORED_QUAKES = 5;

// Helper function to calculate relative time
function getTimeAgo(pastDate: Date) {
  const now = new Date();
  const diffMs = now.getTime() - pastDate.getTime();
  
  // Convert to minutes, hours, days
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  // Format the relative time
  if (diffMinutes < 1) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHours < 24) {
    const remainingMinutes = diffMinutes % 60;
    if (remainingMinutes === 0) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} and ${remainingMinutes} ${remainingMinutes === 1 ? 'minute' : 'minutes'} ago`;
    }
  } else {
    const remainingHours = diffHours % 24;
    const remainingMinutes = diffMinutes % 60;
    
    let result = `${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
    
    if (remainingHours > 0) {
      result += ` ${remainingHours} ${remainingHours === 1 ? 'hour' : 'hours'}`;
    }
    
    if (remainingMinutes > 0) {
      result += ` and ${remainingMinutes} ${remainingMinutes === 1 ? 'minute' : 'minutes'}`;
    }
    
    return result + ' ago';
  }
}

async function fetchWithErrorHandling(url: string) {
  try {
    const response = await fetch(url, { next: { revalidate: CACHE_EXPIRY * 60 } });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const now = Date.now();
    
    // Force a new earthquake if a uniqueId is provided (for refreshes)
    const { searchParams } = new URL(request.url);
    const uniqueId = searchParams.get('uniqueId');
    const forceRefresh = uniqueId !== null;

    // Return cached data if it's still fresh and not forced to refresh
    if (
      !forceRefresh &&
      earthquakeCache && 
      (now - earthquakeCache.timestamp) < CACHE_EXPIRY * 60 * 1000 &&
      earthquakeCache.data
    ) {
      return NextResponse.json(earthquakeCache.data);
    }
    
    // USGS Earthquake API - past hour significant earthquakes
    const significantUrl = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_hour.geojson';
    
    const data = await fetchWithErrorHandling(significantUrl);
    
    if (!data || !data.features || data.features.length === 0) {
      // If no significant earthquakes in the past hour, get all 1.0+ magnitude in the past day
      const fallbackUrl = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/1.0_day.geojson';
      const fallbackData = await fetchWithErrorHandling(fallbackUrl);
      
      if (!fallbackData || !fallbackData.features || fallbackData.features.length === 0) {
        const noDataResponse = { 
          magnitude: 0,
          location: "No significant earthquakes have been recorded recently",
          time: new Date().toISOString(),
          timeAgo: "",
          url: "https://earthquake.usgs.gov/earthquakes/map/"
        };
        
        // Cache the response
        earthquakeCache = {
          data: noDataResponse,
          timestamp: now
        };
        
        return NextResponse.json(noDataResponse);
      }
      
      // Get a random earthquake from the last 24 hours instead of the most recent one
      const recentQuakes = fallbackData.features.filter((q: any) => q.properties.mag >= 1.5);
      
      // Filter out recently shown earthquakes unless we're running out of options
      let availableQuakes = recentQuakes.filter((q: any) => !recentlyShownQuakes.has(q.id));
      
      // If we're running low on new earthquakes, just use all of them
      if (availableQuakes.length < 3) {
        availableQuakes = recentQuakes;
      }
      
      // Pick a random earthquake
      const randomIndex = Math.floor(Math.random() * Math.min(availableQuakes.length, 20));
      const quake = availableQuakes[randomIndex] || fallbackData.features[0];
      
      // Add this quake to recently shown set
      recentlyShownQuakes.add(quake.id);
      
      // If we have too many stored quakes, remove the oldest ones
      if (recentlyShownQuakes.size > MAX_STORED_QUAKES) {
        const oldestQuake = Array.from(recentlyShownQuakes)[0];
        recentlyShownQuakes.delete(oldestQuake);
      }
      
      const place = quake.properties.place;
      const magnitude = quake.properties.mag;
      const quakeTime = new Date(quake.properties.time);
      const timeAgo = getTimeAgo(quakeTime);
      const quakeUrl = quake.properties.url;
      
      const response = {
        magnitude: magnitude,
        location: place,
        time: quakeTime.toISOString(),
        timeAgo: timeAgo,
        url: quakeUrl
      };
      
      // Cache the response
      earthquakeCache = {
        data: response,
        timestamp: now
      };
      
      return NextResponse.json(response);
    }
    
    const quake = data.features[0];
    const place = quake.properties.place;
    const magnitude = quake.properties.mag;
    const quakeTime = new Date(quake.properties.time);
    const timeAgo = getTimeAgo(quakeTime);
    const quakeUrl = quake.properties.url;
    
    const response = {
      magnitude: magnitude,
      location: place,
      time: quakeTime.toISOString(),
      timeAgo: timeAgo,
      url: quakeUrl
    };
    
    // Cache the response
    earthquakeCache = {
      data: response,
      timestamp: now
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Earthquake API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch earthquake data' },
      { status: 500 }
    );
  }
} 
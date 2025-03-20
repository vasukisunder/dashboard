import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
  }

  try {
    console.log(`Fetching geocoding data for coordinates: ${lat}, ${lon}`);
    
    // First try with the exact coordinates
    let response = await fetch(
      `https://geocode.maps.co/reverse?lat=${lat}&lon=${lon}&api_key=67dbc9d19c653460689954tivcf8773`,
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    let data = await response.json();

    // If we get an error, try with rounded coordinates
    if (data.error) {
      console.log('Exact coordinates failed, trying rounded coordinates');
      const roundedLat = Math.round(parseFloat(lat) * 100) / 100;
      const roundedLon = Math.round(parseFloat(lon) * 100) / 100;
      
      response = await fetch(
        `https://geocode.maps.co/reverse?lat=${roundedLat}&lon=${roundedLon}&api_key=67dbc9d19c653460689954tivcf8773`,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      data = await response.json();
    }

    if (data.error) {
      console.error('Geocoding failed with both exact and rounded coordinates');
      return NextResponse.json({ 
        error: 'Unable to geocode location',
        coordinates: { lat, lon }
      }, { status: 500 });
    }

    console.log('Geocoding API response:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json({ 
      error: 'Failed to geocode location',
      coordinates: { lat, lon }
    }, { status: 500 });
  }
} 
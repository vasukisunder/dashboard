import { NextResponse } from 'next/server';

// Cache Bitcoin data to avoid hitting API limits
let bitcoinCache: {
  data: any;
  timestamp: number;
} | null = null;

// Cache expiry in seconds
const CACHE_EXPIRY = 60; // 1 minute

export async function GET(request: Request) {
  try {
    // Check for force refresh parameter
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('forceRefresh') === 'true';
    
    // Check cache (always use cache unless force refresh)
    const now = Date.now();
    if (
      !forceRefresh &&
      bitcoinCache && 
      (now - bitcoinCache.timestamp) < CACHE_EXPIRY * 1000
    ) {
      console.log('Returning cached Bitcoin data');
      return NextResponse.json(bitcoinCache.data);
    }
    
    // Try CoinGecko API with retry logic
    let attempts = 0;
    let bitcoinData = null;
    
    while (!bitcoinData && attempts < 2) {
      attempts++;
      console.log(`CoinGecko attempt ${attempts}...`);
      
      // Add delay between attempts to avoid rate limiting
      if (attempts > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      try {
        bitcoinData = await fetchCoinGeckoData();
        if (bitcoinData) {
          console.log('Successfully retrieved Bitcoin data from CoinGecko');
        }
      } catch (err) {
        console.error(`CoinGecko attempt ${attempts} failed:`, err);
      }
    }
    
    // If CoinGecko fails, try Alpha Vantage
    if (!bitcoinData) {
      console.log('Trying Alpha Vantage API...');
      try {
        bitcoinData = await fetchAlphaVantageData();
        if (bitcoinData) {
          console.log('Successfully retrieved Bitcoin data from Alpha Vantage');
        }
      } catch (err) {
        console.error('Alpha Vantage API failed:', err);
      }
    }
    
    // If both APIs fail, return error
    if (!bitcoinData) {
      console.error('All Bitcoin data sources failed');
      return NextResponse.json({ error: 'Unable to fetch real Bitcoin data' }, { status: 503 });
    }
    
    // Store in cache
    bitcoinCache = {
      data: bitcoinData,
      timestamp: now
    };
    
    return NextResponse.json(bitcoinData);
  } catch (error) {
    console.error('Bitcoin API error:', error);
    return NextResponse.json({ error: 'Failed to retrieve Bitcoin data' }, { status: 500 });
  }
}

// CoinGecko API (free, no API key required)
async function fetchCoinGeckoData() {
  const url = 'https://api.coingecko.com/api/v3/coins/bitcoin?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false';
  
  const response = await fetch(url, {
    method: 'GET',
    cache: 'no-store',
    headers: {
      'Accept': 'application/json',
      // Add user agent to avoid being blocked
      'User-Agent': 'Mozilla/5.0 Dashboard App'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch CoinGecko data: ${response.status}`);
  }
  
  const apiData = await response.json();
  
  // Validate the data
  if (!apiData.market_data || !apiData.market_data.current_price || !apiData.market_data.current_price.usd) {
    throw new Error('Invalid data structure from CoinGecko');
  }
  
  return {
    price: apiData.market_data.current_price.usd,
    changePercent24h: apiData.market_data.price_change_percentage_24h || 0,
    source: 'CoinGecko'
  };
}

// Alpha Vantage API (as backup)
async function fetchAlphaVantageData() {
  // Use a better key if available
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY || 'demo';
  const url = `https://www.alphavantage.co/query?function=CRYPTO_INTRADAY&symbol=BTC&market=USD&interval=5min&apikey=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'GET',
    cache: 'no-store',
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 Dashboard App'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch Alpha Vantage data: ${response.status}`);
  }
  
  const data = await response.json();
  
  // Check if we have valid data
  if (data.Note && data.Note.includes('API call frequency')) {
    throw new Error('Alpha Vantage API rate limit exceeded');
  }
  
  // Get time series data
  const timeSeriesKey = 'Time Series Crypto (5min)';
  if (!data[timeSeriesKey] || Object.keys(data[timeSeriesKey]).length === 0) {
    throw new Error('No time series data available');
  }
  
  // Get the latest data point
  const timestamps = Object.keys(data[timeSeriesKey]).sort().reverse();
  const latestData = data[timeSeriesKey][timestamps[0]];
  
  if (!latestData || !latestData['4. close']) {
    throw new Error('Invalid data format from Alpha Vantage');
  }
  
  const currentPrice = parseFloat(latestData['4. close']);
  
  // For 24h change, compare with data from ~24h ago or use a reasonable default
  let changePercent24h = 0;
  
  // If we have data from 24h ago
  if (timestamps.length > 288) { // 288 5-min intervals in 24h
    const oldData = data[timeSeriesKey][timestamps[288]];
    if (oldData && oldData['4. close']) {
      const oldPrice = parseFloat(oldData['4. close']);
      changePercent24h = ((currentPrice - oldPrice) / oldPrice) * 100;
    }
  }
  
  return {
    price: currentPrice,
    changePercent24h: changePercent24h,
    source: 'Alpha Vantage'
  };
} 
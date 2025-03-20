import { NextResponse } from 'next/server';

// Cache expiry in minutes
const CACHE_EXPIRY = 2;
let wikiCache: {
  updates: Array<{
    title: string;
    link: string;
    timestamp: string;
  }>;
  timestamp: number;
  usedIndices: Set<number>;
} | null = null;

// Global mapping from uniqueId to index to ensure different tiles get different updates
const tileAssignedIndices = new Map<string, number>();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const preventDuplicates = searchParams.get('preventDuplicates') !== 'false'; // Default to true
    const uniqueId = searchParams.get('uniqueId') || 'default';
    const refresh = searchParams.get('refresh') === 'true';
    
    // Check if we have cached data and if it's still fresh
    const now = Date.now();
    
    // Use a local variable to make TypeScript happy
    const cache = wikiCache;
    
    if (
      !refresh &&
      cache && 
      (now - cache.timestamp) < CACHE_EXPIRY * 60 * 1000 &&
      cache.updates.length > 0
    ) {
      // Get an unused update if possible
      let nextIndex = 0;
      
      // If we already assigned an index to this uniqueId, use it
      if (tileAssignedIndices.has(uniqueId)) {
        const existingIndex = tileAssignedIndices.get(uniqueId);
        if (existingIndex !== undefined && existingIndex < cache.updates.length) {
          return NextResponse.json(cache.updates[existingIndex]);
        }
      }
      
      if (preventDuplicates) {
        // Initialize usedIndices if it doesn't exist
        if (!cache.usedIndices) {
          cache.usedIndices = new Set<number>();
        }
        
        const availableIndices = Array.from(
          { length: cache.updates.length },
          (_, i) => i
        ).filter(i => {
          // An index is available if it's not being used by any tile
          return !Array.from(tileAssignedIndices.values()).includes(i);
        });
        
        // If all indices are used, start reusing (but avoid collisions if possible)
        if (availableIndices.length === 0) {
          nextIndex = Math.floor(Math.random() * cache.updates.length);
          // Try to find an index that's not currently assigned
          for (let attempt = 0; attempt < 5; attempt++) {
            const candidateIndex = Math.floor(Math.random() * cache.updates.length);
            if (!Array.from(tileAssignedIndices.values()).includes(candidateIndex)) {
              nextIndex = candidateIndex;
              break;
            }
          }
        } else {
          // Get a random unused index from available ones
          nextIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        }
      } else {
        // Just get a random update
        nextIndex = Math.floor(Math.random() * cache.updates.length);
      }
      
      // Store the assignment for future requests
      tileAssignedIndices.set(uniqueId, nextIndex);
      
      const update = cache.updates[nextIndex];
      return NextResponse.json(update);
    }
    
    try {
      // Fetch fresh data from Wikipedia API
      // Reference: https://www.mediawiki.org/wiki/API:RecentChanges
      const url = 'https://en.wikipedia.org/w/api.php?' + new URLSearchParams({
        action: 'query',
        list: 'recentchanges',
        rcnamespace: '0',  // Main namespace only (articles)
        rclimit: '50',     // Get 50 results to filter from
        rctype: 'edit',    // Only edits (not new pages, logs, etc.)
        rcshow: '!minor|!bot|!redirect', // No minor edits, bot edits, or redirects
        rcprop: 'title|timestamp',       // Title and timestamp
        format: 'json',
        origin: '*'
      }).toString();
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Wikipedia API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.query && data.query.recentchanges && data.query.recentchanges.length > 0) {
        // Filter to get more interesting results
        // Skip titles with certain patterns that are likely to be less interesting
        const filteredChanges = data.query.recentchanges.filter((change: any) => {
          const title = change.title;
          // Skip titles with certain patterns like numbers, dates, etc.
          return (
            !title.match(/^\d+$/) && // Skip titles that are just numbers
            !title.match(/^\d{1,2} (January|February|March|April|May|June|July|August|September|October|November|December)/) && // Skip date articles
            !title.match(/^List of/) && // Skip list articles
            !title.includes('(disambiguation)') && // Skip disambiguation pages
            !title.match(/^Draft:/) && // Skip draft pages
            !title.match(/^Wikipedia:/) && // Skip Wikipedia pages
            !title.match(/^Template:/) && // Skip template pages
            !title.match(/^Category:/) && // Skip category pages
            !title.match(/^Portal:/) && // Skip portal pages
            !title.match(/^File:/) && // Skip file pages
            !title.match(/^Help:/) && // Skip help pages
            !title.match(/^Module:/) // Skip module pages
          );
        });
        
        // Create wiki updates from filtered changes
        const updates = filteredChanges.map((change: any) => ({
          title: change.title,
          link: `https://en.wikipedia.org/wiki/${encodeURIComponent(change.title.replace(/ /g, '_'))}`,
          timestamp: change.timestamp
        }));
        
        // Cache the results
        wikiCache = {
          updates,
          timestamp: now,
          usedIndices: new Set<number>()
        };
        
        // Assign a different index to this tile
        let updateIndex = 0;
        
        // If we already have assigned some tiles, make sure this one gets a different index
        if (tileAssignedIndices.size > 0) {
          const usedIndices = Array.from(tileAssignedIndices.values());
          // Try to find an index that's not currently assigned
          for (let i = 0; i < Math.min(updates.length, 10); i++) {
            if (!usedIndices.includes(i)) {
              updateIndex = i;
              break;
            }
          }
        }
        
        tileAssignedIndices.set(uniqueId, updateIndex);
        const update = updates[updateIndex];
        
        return NextResponse.json(update);
      } else {
        throw new Error('No Wikipedia updates found');
      }
    } catch (apiError) {
      console.error('Wikipedia API call failed:', apiError);
      
      // Fallback data if API fails
      const fallbackUpdates = [
        {
          title: "Artificial intelligence",
          link: "https://en.wikipedia.org/wiki/Artificial_intelligence",
          timestamp: new Date().toISOString()
        },
        {
          title: "Mars rover",
          link: "https://en.wikipedia.org/wiki/Mars_rover",
          timestamp: new Date().toISOString()
        },
        {
          title: "Quantum computing",
          link: "https://en.wikipedia.org/wiki/Quantum_computing",
          timestamp: new Date().toISOString()
        },
        {
          title: "Solar System",
          link: "https://en.wikipedia.org/wiki/Solar_System",
          timestamp: new Date().toISOString()
        },
        {
          title: "Black hole",
          link: "https://en.wikipedia.org/wiki/Black_hole",
          timestamp: new Date().toISOString()
        },
        {
          title: "Climate change",
          link: "https://en.wikipedia.org/wiki/Climate_change",
          timestamp: new Date().toISOString()
        }
      ];
      
      // Find an index that hasn't been used by another tile
      let fallbackIndex = 0;
      const usedIndices = Array.from(tileAssignedIndices.values());
      
      // Try to avoid collision with other tiles
      for (let i = 0; i < fallbackUpdates.length; i++) {
        if (!usedIndices.includes(i)) {
          fallbackIndex = i;
          break;
        }
      }
      
      // Store the assignment
      tileAssignedIndices.set(uniqueId, fallbackIndex);
      
      return NextResponse.json(fallbackUpdates[fallbackIndex]);
    }
  } catch (error) {
    console.error('Wikipedia API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Wikipedia updates' },
      { status: 500 }
    );
  }
}
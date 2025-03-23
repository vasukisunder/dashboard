import { NextResponse } from 'next/server';
import { getRandomCountry } from '../../utils/geography';

// NYT API sections
const sections = [
  'arts', 'automobiles', 'books', 'business', 'fashion', 'food', 'health',
  'home', 'insider', 'magazine', 'movies', 'nyregion', 'obituaries', 'opinion',
  'politics', 'realestate', 'science', 'sports', 'sundayreview', 'technology',
  'theater', 't-magazine', 'travel', 'upshot', 'us', 'world'
];

// Helper to get a random section
function getRandomSection() {
  const randomIndex = Math.floor(Math.random() * sections.length);
  return sections[randomIndex];
}

// Format section name for display
function formatSectionName(section: string): string {
  return section
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Create separate caches for each section to ensure complete isolation
const newsCacheBySection: Record<string, {
  data: any[];
  timestamp: number;
  usedIndices: Set<number>;
}> = {
  science: { data: [], timestamp: 0, usedIndices: new Set() },
  arts: { data: [], timestamp: 0, usedIndices: new Set() },
  travel: { data: [], timestamp: 0, usedIndices: new Set() },
  technology: { data: [], timestamp: 0, usedIndices: new Set() },
  default: { data: [], timestamp: 0, usedIndices: new Set() }
};

// API call tracking to prevent rate limit issues
let lastApiCallTime = 0;
const MIN_API_CALL_INTERVAL = 10000; // Minimum 10 seconds between API calls

// Track used photo URLs globally to avoid duplicates across tiles
const usedPhotoUrls = new Set<string>();

// Cache expiry in minutes - setting to a moderate value to balance freshness with API limits
const CACHE_EXPIRY = 60; // Cache for 1 hour to avoid hitting rate limits

// Number of articles to rotate through before potentially seeing repeats
const MIN_ARTICLES_BEFORE_REPEAT = 10;

// NYT API key
const NYT_API_KEY = 'sgNq3YMInuHu0e2imoGXGGVZ1GckMLof';

// Global request counter to ensure randomness
let requestCounter = 0;

export async function GET(request: Request) {
  try {
    // Increment request counter to ensure different articles each time
    requestCounter++;
    
    // Extract section from URL params or use random one
    const { searchParams } = new URL(request.url);
    let section = searchParams.get('section');
    const preventDuplicates = searchParams.get('preventDuplicates') !== 'false'; // Default to true
    
    // Interpret specific tile identifiers to ensure different tiles get different content
    const requestedTileId = searchParams.get('uniqueId') || 'default';
    const isTileRequest = requestedTileId.includes('tile');
    
    // Only force refresh if explicitly requested and enough time has passed
    // Exception: for problematic sections (science, arts, travel), be more aggressive with refreshing
    const forceRefreshRequested = searchParams.get('forceRefresh') === 'true';
    const isProblematicSection = section === 'science' || section === 'arts' || section === 'travel';
    const currentTime = Date.now();
    const timePassedSinceLastCall = currentTime - lastApiCallTime;
    const forceRefresh = (forceRefreshRequested || isProblematicSection) && 
                         (timePassedSinceLastCall > MIN_API_CALL_INTERVAL || isProblematicSection);
    
    // Add request counter to uniqueId to ensure randomness
    // For problematic sections, add extra randomness
    const uniqueId = isProblematicSection ? 
      `${requestedTileId}-${section}-${requestCounter}-${Date.now()}-${Math.random().toString(36).slice(2)}` :
      `${requestedTileId}-${requestCounter}-${Date.now()}`;
    
    // If no section is provided or it's not in our list, get a random one
    if (!section || !sections.includes(section)) {
      section = getRandomSection();
    }
    
    const now = Date.now();
    // For problematic sections, use much shorter cache expiry
    const sectionCacheExpiry = isProblematicSection ? 2 : CACHE_EXPIRY; // 2 minutes for problematic sections
    const needsRefresh = !newsCacheBySection[section] || 
                          (now - newsCacheBySection[section].timestamp) > sectionCacheExpiry * 60 * 1000 ||
                          forceRefresh;
    
    // Check if we have cached data that we can use instead of making an API call
    if (!needsRefresh && newsCacheBySection[section].data.length >= MIN_ARTICLES_BEFORE_REPEAT) {
      const articleCount = newsCacheBySection[section].data.length;
      
      // Select a random article that hasn't been used recently if possible
      let randomIndex;
      
      if (preventDuplicates) {
        // Find an index that hasn't been used recently
        const usedIndices = newsCacheBySection[section].usedIndices;
        const availableIndices = Array.from(
          { length: articleCount }, 
          (_, i) => i
        ).filter(i => !usedIndices.has(i));
        
        if (availableIndices.length > 0) {
          // Use a random unused index
          randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        } else {
          // If all indices have been used, select a completely random one
          randomIndex = Math.floor(Math.random() * articleCount);
          // And clear the used indices to start fresh
          newsCacheBySection[section].usedIndices.clear();
        }
        
        // Mark this index as used
        newsCacheBySection[section].usedIndices.add(randomIndex);
      } else {
        // If not preventing duplicates, just use a random index
        randomIndex = Math.floor(Math.random() * articleCount);
      }
      
      console.log(`Using cached article ${randomIndex} of ${articleCount} for section: ${section}`);
      
      const article = newsCacheBySection[section].data[randomIndex];
      
      // Get the image URL if available
      const photo_url = article.multimedia && article.multimedia.length > 0 
        ? article.multimedia[0].url 
        : null;
        
      return NextResponse.json({
        section,
        headline: article.title,
        source: 'The New York Times',
        sectionName: formatSectionName(section),
        photo_url: photo_url,
        link: article.url,
        snippet: article.abstract || null
      });
    }
    
    // If we need fresh data and enough time has passed since last API call
    if ((needsRefresh || newsCacheBySection[section].data.length < MIN_ARTICLES_BEFORE_REPEAT) && 
        timePassedSinceLastCall > MIN_API_CALL_INTERVAL) {
      try {
        console.log(`Fetching fresh news data for section: ${section} (request ${requestCounter})`);
        lastApiCallTime = currentTime; // Update last API call time
        
        // Fetch news from the requested section
        const mainUrl = `https://api.nytimes.com/svc/topstories/v2/${section}.json?api-key=${NYT_API_KEY}`;
        
        const mainResponse = await fetch(mainUrl, {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!mainResponse.ok) {
          console.warn(`NYT API main section responded with status: ${mainResponse.status}`);
          throw new Error(`NYT API responded with status: ${mainResponse.status}`);
        }
        
        // Process main section data
        let mainArticles: any[] = [];
        const mainData = await mainResponse.json();
        
        if (mainData.results && mainData.results.length > 0) {
          // Prioritize articles with images but include all for more diversity
          const articlesWithImages = mainData.results.filter(
            (article: any) => article.multimedia && article.multimedia.length > 0
          );
          
          const articlesWithoutImages = mainData.results.filter(
            (article: any) => !article.multimedia || article.multimedia.length === 0
          );
          
          // Prioritize articles with images by putting them first
          mainArticles = [...articlesWithImages, ...articlesWithoutImages];
        }
        
        if (mainArticles.length === 0) {
          throw new Error('No articles found for this section');
        }
        
        // Shuffle articles for randomness
        const shuffledArticles = shuffleArray(mainArticles);
        
        console.log(`Loaded ${shuffledArticles.length} articles for section: ${section}`);
        
        // Update the cache
        newsCacheBySection[section].data = shuffledArticles;
        newsCacheBySection[section].timestamp = now;
        newsCacheBySection[section].usedIndices = new Set();
        
        // Select a random article from the fresh data
        const randomIndex = Math.floor(Math.random() * shuffledArticles.length);
        const article = shuffledArticles[randomIndex];
        
        // Mark this index as used
        newsCacheBySection[section].usedIndices.add(randomIndex);
        
        // Get the image URL if available
        const photo_url = article.multimedia && article.multimedia.length > 0 
          ? article.multimedia[0].url 
          : null;
          
        return NextResponse.json({
          section,
          headline: article.title,
          source: 'The New York Times',
          sectionName: formatSectionName(section),
          photo_url: photo_url,
          link: article.url,
          snippet: article.abstract || null
        });
      } catch (apiError) {
        console.error('NYT API call failed:', apiError);
        
        // If we have any cached data for this section, use it instead of dummy data
        if (newsCacheBySection[section] && newsCacheBySection[section].data.length > 0) {
          console.log(`API call failed, falling back to cached data for section: ${section}`);
          
          const randomIndex = Math.floor(Math.random() * newsCacheBySection[section].data.length);
          const article = newsCacheBySection[section].data[randomIndex];
          
          // Get the image URL if available
          const photo_url = article.multimedia && article.multimedia.length > 0 
            ? article.multimedia[0].url 
            : null;
            
          return NextResponse.json({
            section,
            headline: article.title,
            source: 'The New York Times',
            sectionName: formatSectionName(section),
            photo_url: photo_url,
            link: article.url,
            snippet: article.abstract || null
          });
        }
        
        // Mock news data to use only if API fails AND we have no cached data
        let dummyNews;
        
        // For problematic sections, use section-specific dummy data to ensure variety
        if (section === 'science') {
          dummyNews = [
            {
              headline: "Astronomers discover unusual signals from distant galaxy",
              source: "The New York Times",
              photo_url: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1000&auto=format&fit=crop",
              link: "https://www.nytimes.com/section/science",
              snippet: "New findings could reshape our understanding of deep space."
            },
            {
              headline: "Revolutionary gene editing technique shows promise in clinical trials",
              source: "The New York Times",
              photo_url: "https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=1000&auto=format&fit=crop",
              link: "https://www.nytimes.com/section/science",
              snippet: "CRISPR applications advance medical treatments for genetic disorders."
            },
            {
              headline: "Climate researchers document unprecedented changes in Arctic ice",
              source: "The New York Times",
              photo_url: "https://images.unsplash.com/photo-1520923642038-b4259acecbd7?q=80&w=1000&auto=format&fit=crop",
              link: "https://www.nytimes.com/section/science",
              snippet: "New data suggests faster pace of climate change than previously thought."
            }
          ];
        } else if (section === 'arts') {
          dummyNews = [
            {
              headline: "Major retrospective of modernist painter opens at national gallery",
              source: "The New York Times",
              photo_url: "https://images.unsplash.com/photo-1580136579312-94651dfd596d?q=80&w=1000&auto=format&fit=crop",
              link: "https://www.nytimes.com/section/arts",
              snippet: "Exhibition explores five decades of influential work."
            },
            {
              headline: "Immersive digital art installation transforms historic building",
              source: "The New York Times",
              photo_url: "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?q=80&w=1000&auto=format&fit=crop",
              link: "https://www.nytimes.com/section/arts",
              snippet: "Interactive experience blends technology with traditional spaces."
            },
            {
              headline: "Rediscovered manuscript by renowned author to be published",
              source: "The New York Times",
              photo_url: "https://images.unsplash.com/photo-1476275466078-4007374efbbe?q=80&w=1000&auto=format&fit=crop",
              link: "https://www.nytimes.com/section/arts",
              snippet: "Lost work found in private collection after decades."
            }
          ];
        } else if (section === 'travel') {
          dummyNews = [
            {
              headline: "Remote island destination sees tourism boom after preservation efforts",
              source: "The New York Times",
              photo_url: "https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?q=80&w=1000&auto=format&fit=crop",
              link: "https://www.nytimes.com/section/travel",
              snippet: "Sustainable tourism model attracts eco-conscious travelers."
            },
            {
              headline: "Historic railway route reopens with luxury accommodations",
              source: "The New York Times",
              photo_url: "https://images.unsplash.com/photo-1474540412665-1cdae210ae6b?q=80&w=1000&auto=format&fit=crop",
              link: "https://www.nytimes.com/section/travel",
              snippet: "Journey through scenic mountains combines nostalgia with modern comfort."
            },
            {
              headline: "Hidden culinary destinations reveal authentic local traditions",
              source: "The New York Times",
              photo_url: "https://images.unsplash.com/photo-1533777324565-a040eb52facd?q=80&w=1000&auto=format&fit=crop",
              link: "https://www.nytimes.com/section/travel",
              snippet: "Food tourism drives interest in previously overlooked regions."
            }
          ];
        } else {
          dummyNews = [
            {
              headline: "Global climate conference proposes new emissions targets",
              source: "The New York Times",
              photo_url: "https://images.unsplash.com/photo-1611270629569-8b357cb88da9?q=80&w=1000&auto=format&fit=crop",
              link: "https://www.nytimes.com/",
              snippet: "World leaders gathered to discuss new climate initiatives."
            },
            {
              headline: "Researchers discover promising treatment for rare disease",
              source: "The New York Times",
              photo_url: "https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=1000&auto=format&fit=crop",
              link: "https://www.nytimes.com/section/health",
              snippet: "New study shows potential breakthrough for patients."
            },
            {
              headline: "Space agency announces plans for new lunar mission",
              source: "The New York Times",
              photo_url: "https://images.unsplash.com/photo-1454789548928-9efd52dc4031?q=80&w=1000&auto=format&fit=crop",
              link: "https://www.nytimes.com/section/science",
              snippet: "Mission expected to launch within the next five years."
            },
            {
              headline: "Tech giant unveils innovative sustainable energy solution",
              source: "The New York Times",
              photo_url: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?q=80&w=1000&auto=format&fit=crop",
              link: "https://www.nytimes.com/section/technology",
              snippet: "New technology could reduce carbon footprint by 30%."
            },
            {
              headline: "International summit addresses economic cooperation",
              source: "The New York Times",
              photo_url: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1000&auto=format&fit=crop",
              link: "https://www.nytimes.com/section/business",
              snippet: "Leaders agree on framework for future trade relations."
            },
            {
              headline: "Breakthrough in material science leads to stronger, lighter composites",
              source: "The New York Times",
              photo_url: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?q=80&w=1000&auto=format&fit=crop",
              link: "https://www.nytimes.com/section/science",
              snippet: "New materials could revolutionize aerospace industry."
            }
          ];
        }
        
        // Track used dummy news to avoid duplicates
        let availableNews = dummyNews.filter(news => !usedPhotoUrls.has(news.photo_url));
        
        // If all dummy news have been used, reset
        if (availableNews.length === 0) {
          usedPhotoUrls.clear();
          availableNews = dummyNews;
        }
        
        // Select a random news item
        const randomIndex = Math.floor(Math.random() * availableNews.length);
        const randomNews = availableNews[randomIndex];
        
        // Mark as used
        usedPhotoUrls.add(randomNews.photo_url);
        
        // Create a fake section name based on the article content
        const fakeSection = section || (
          randomNews.headline.toLowerCase().includes("climate") ? "climate" :
          randomNews.headline.toLowerCase().includes("disease") ? "health" :
          randomNews.headline.toLowerCase().includes("space") ? "science" :
          randomNews.headline.toLowerCase().includes("tech") ? "technology" :
          randomNews.headline.toLowerCase().includes("economic") ? "business" :
          "world"
        );
        
        return NextResponse.json({
          section: fakeSection,
          headline: randomNews.headline,
          source: randomNews.source,
          sectionName: formatSectionName(fakeSection),
          photo_url: randomNews.photo_url,
          link: randomNews.link,
          snippet: randomNews.snippet
        });
      }
    } else {
      // If we need fresh data but not enough time has passed since last API call,
      // use cached data if available
      if (newsCacheBySection[section] && newsCacheBySection[section].data.length > 0) {
        console.log(`Using cached data for section: ${section} (rate limit protection)`);
        
        const randomIndex = Math.floor(Math.random() * newsCacheBySection[section].data.length);
        const article = newsCacheBySection[section].data[randomIndex];
        
        // Get the image URL if available
        const photo_url = article.multimedia && article.multimedia.length > 0 
          ? article.multimedia[0].url 
          : null;
          
        return NextResponse.json({
          section,
          headline: article.title,
          source: 'The New York Times',
          sectionName: formatSectionName(section),
          photo_url: photo_url,
          link: article.url,
          snippet: article.abstract || null
        });
      } else {
        // If we have no cached data and can't make an API call, use dummy data
        console.log(`Using dummy data for section: ${section} (rate limit protection)`);
        
        // Use the dummy news logic from above (same as in the catch block)
        let dummyNews;
        
        // For problematic sections, use section-specific dummy data to ensure variety
        if (section === 'science') {
          dummyNews = [
            {
              headline: "Astronomers discover unusual signals from distant galaxy",
              source: "The New York Times",
              photo_url: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1000&auto=format&fit=crop",
              link: "https://www.nytimes.com/section/science",
              snippet: "New findings could reshape our understanding of deep space."
            },
            {
              headline: "Revolutionary gene editing technique shows promise in clinical trials",
              source: "The New York Times",
              photo_url: "https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=1000&auto=format&fit=crop",
              link: "https://www.nytimes.com/section/science",
              snippet: "CRISPR applications advance medical treatments for genetic disorders."
            },
            {
              headline: "Climate researchers document unprecedented changes in Arctic ice",
              source: "The New York Times",
              photo_url: "https://images.unsplash.com/photo-1520923642038-b4259acecbd7?q=80&w=1000&auto=format&fit=crop",
              link: "https://www.nytimes.com/section/science",
              snippet: "New data suggests faster pace of climate change than previously thought."
            }
          ];
        } else if (section === 'arts') {
          dummyNews = [
            {
              headline: "Major retrospective of modernist painter opens at national gallery",
              source: "The New York Times",
              photo_url: "https://images.unsplash.com/photo-1580136579312-94651dfd596d?q=80&w=1000&auto=format&fit=crop",
              link: "https://www.nytimes.com/section/arts",
              snippet: "Exhibition explores five decades of influential work."
            },
            {
              headline: "Immersive digital art installation transforms historic building",
              source: "The New York Times",
              photo_url: "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?q=80&w=1000&auto=format&fit=crop",
              link: "https://www.nytimes.com/section/arts",
              snippet: "Interactive experience blends technology with traditional spaces."
            },
            {
              headline: "Rediscovered manuscript by renowned author to be published",
              source: "The New York Times",
              photo_url: "https://images.unsplash.com/photo-1476275466078-4007374efbbe?q=80&w=1000&auto=format&fit=crop",
              link: "https://www.nytimes.com/section/arts",
              snippet: "Lost work found in private collection after decades."
            }
          ];
        } else if (section === 'travel') {
          dummyNews = [
            {
              headline: "Remote island destination sees tourism boom after preservation efforts",
              source: "The New York Times",
              photo_url: "https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?q=80&w=1000&auto=format&fit=crop",
              link: "https://www.nytimes.com/section/travel",
              snippet: "Sustainable tourism model attracts eco-conscious travelers."
            },
            {
              headline: "Historic railway route reopens with luxury accommodations",
              source: "The New York Times",
              photo_url: "https://images.unsplash.com/photo-1474540412665-1cdae210ae6b?q=80&w=1000&auto=format&fit=crop",
              link: "https://www.nytimes.com/section/travel",
              snippet: "Journey through scenic mountains combines nostalgia with modern comfort."
            },
            {
              headline: "Hidden culinary destinations reveal authentic local traditions",
              source: "The New York Times",
              photo_url: "https://images.unsplash.com/photo-1533777324565-a040eb52facd?q=80&w=1000&auto=format&fit=crop",
              link: "https://www.nytimes.com/section/travel",
              snippet: "Food tourism drives interest in previously overlooked regions."
            }
          ];
        } else {
          dummyNews = [
            {
              headline: "Global climate conference proposes new emissions targets",
              source: "The New York Times",
              photo_url: "https://images.unsplash.com/photo-1611270629569-8b357cb88da9?q=80&w=1000&auto=format&fit=crop",
              link: "https://www.nytimes.com/",
              snippet: "World leaders gathered to discuss new climate initiatives."
            },
            {
              headline: "Researchers discover promising treatment for rare disease",
              source: "The New York Times",
              photo_url: "https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=1000&auto=format&fit=crop",
              link: "https://www.nytimes.com/section/health",
              snippet: "New study shows potential breakthrough for patients."
            },
            {
              headline: "Space agency announces plans for new lunar mission",
              source: "The New York Times",
              photo_url: "https://images.unsplash.com/photo-1454789548928-9efd52dc4031?q=80&w=1000&auto=format&fit=crop",
              link: "https://www.nytimes.com/section/science",
              snippet: "Mission expected to launch within the next five years."
            },
            {
              headline: "Tech giant unveils innovative sustainable energy solution",
              source: "The New York Times",
              photo_url: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?q=80&w=1000&auto=format&fit=crop",
              link: "https://www.nytimes.com/section/technology",
              snippet: "New technology could reduce carbon footprint by 30%."
            },
            {
              headline: "International summit addresses economic cooperation",
              source: "The New York Times",
              photo_url: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1000&auto=format&fit=crop",
              link: "https://www.nytimes.com/section/business",
              snippet: "Leaders agree on framework for future trade relations."
            },
            {
              headline: "Breakthrough in material science leads to stronger, lighter composites",
              source: "The New York Times",
              photo_url: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?q=80&w=1000&auto=format&fit=crop",
              link: "https://www.nytimes.com/section/science",
              snippet: "New materials could revolutionize aerospace industry."
            }
          ];
        }
        
        // Rest of dummy news logic (same as above)
        let availableNews = dummyNews.filter(news => !usedPhotoUrls.has(news.photo_url));
        
        if (availableNews.length === 0) {
          usedPhotoUrls.clear();
          availableNews = dummyNews;
        }
        
        const randomIndex = Math.floor(Math.random() * availableNews.length);
        const randomNews = availableNews[randomIndex];
        
        usedPhotoUrls.add(randomNews.photo_url);
        
        const fakeSection = section || "world";
        
        return NextResponse.json({
          section: fakeSection,
          headline: randomNews.headline,
          source: randomNews.source,
          sectionName: formatSectionName(fakeSection),
          photo_url: randomNews.photo_url,
          link: randomNews.link,
          snippet: randomNews.snippet
        });
      }
    }
  } catch (error) {
    console.error('News API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}

// Helper function to shuffle an array
function shuffleArray(array: any[]) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
} 
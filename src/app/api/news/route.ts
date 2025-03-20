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

// Cache news data to avoid hitting API limits
let newsCache: {
  [section: string]: {
    articles: any[];
    timestamp: number;
    usedIndices: Set<number>;
  }
} = {};

// Track used photo URLs globally to avoid duplicates across tiles
const usedPhotoUrls = new Set<string>();

// Cache expiry in minutes - drastically reducing to get fresh content more often
const CACHE_EXPIRY = 10; // Only cache for 10 minutes

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
    
    // Always force refresh to get fresh content
    const forceRefresh = true;
    
    // Add request counter to uniqueId to ensure randomness
    const uniqueId = `${searchParams.get('uniqueId') || 'default'}-${requestCounter}-${Date.now()}`;
    
    // If no section is provided or it's not in our list, get a random one
    if (!section || !sections.includes(section)) {
      section = getRandomSection();
    }
    
    const now = Date.now();
    const needsRefresh = !newsCache[section] || 
                          (now - newsCache[section].timestamp) > CACHE_EXPIRY * 60 * 1000 ||
                          forceRefresh;
    
    // If we need fresh data or cached data doesn't have enough articles, fetch new data
    if (needsRefresh || (newsCache[section]?.articles.length < MIN_ARTICLES_BEFORE_REPEAT)) {
      try {
        console.log(`Fetching fresh news data for section: ${section} (request ${requestCounter})`);
        
        // Fetch news from two different sections to get more variety
        const extraSection = getRandomSection();
        console.log(`Also fetching from extra section: ${extraSection} for more variety`);
        
        const mainUrl = `https://api.nytimes.com/svc/topstories/v2/${section}.json?api-key=${NYT_API_KEY}`;
        const extraUrl = `https://api.nytimes.com/svc/topstories/v2/${extraSection}.json?api-key=${NYT_API_KEY}`;
        
        // Fetch both in parallel for efficiency
        const [mainResponse, extraResponse] = await Promise.all([
          fetch(mainUrl, {
            method: 'GET',
            cache: 'no-store',
            headers: {
              'Accept': 'application/json'
            }
          }),
          fetch(extraUrl, {
            method: 'GET',
            cache: 'no-store',
            headers: {
              'Accept': 'application/json'
            }
          })
        ]);
        
        if (!mainResponse.ok) {
          console.warn(`NYT API main section responded with status: ${mainResponse.status}`);
        }
        
        if (!extraResponse.ok) {
          console.warn(`NYT API extra section responded with status: ${extraResponse.status}`);
        }
        
        // Process main section data
        let mainArticles: any[] = [];
        if (mainResponse.ok) {
          const mainData = await mainResponse.json();
          if (mainData.results && mainData.results.length > 0) {
            mainArticles = mainData.results.filter(
              (article: any) => article.multimedia && article.multimedia.length > 0
            );
          }
        }
        
        // Process extra section data
        let extraArticles: any[] = [];
        if (extraResponse.ok) {
          const extraData = await extraResponse.json();
          if (extraData.results && extraData.results.length > 0) {
            extraArticles = extraData.results.filter(
              (article: any) => article.multimedia && article.multimedia.length > 0
            );
          }
        }
        
        // Combine and shuffle articles
        let allArticles = [...mainArticles, ...extraArticles];
        
        if (allArticles.length === 0) {
          throw new Error('No articles with images found');
        }
        
        // Double-shuffle for more randomness
        allArticles = shuffleArray(shuffleArray(allArticles));
        
        console.log(`Loaded ${allArticles.length} articles total (${mainArticles.length} from ${section}, ${extraArticles.length} from ${extraSection})`);
        
        // Clear the usedIndices to start fresh
        newsCache[section] = {
          articles: allArticles,
          timestamp: now,
          usedIndices: new Set()
        };
      } catch (apiError) {
        console.error('NYT API call failed:', apiError);
        // Mock news data to use if API fails
        const dummyNews = [
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
    }
    
    // If we have cached data for this section
    if (newsCache[section] && newsCache[section].articles.length > 0) {
      const articleCount = newsCache[section].articles.length;
      
      // Always choose a truly random article, ignoring previous usage
      // This ensures maximum variety even if it means repeating occasionally
      const randomIndex = Math.floor(Math.random() * articleCount);
      
      console.log(`Selected random article ${randomIndex} of ${articleCount} for section: ${section}`);
      
      const article = newsCache[section].articles[randomIndex];
      
      // Get the image URL if available
      const photo_url = article.multimedia && article.multimedia.length > 0 
        ? article.multimedia[0].url 
        : null;
        
      // Don't track used photo URLs anymore to maximize variety
      // Instead, we'll rely on the larger pool of articles and true randomness
        
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
    
    // Fallback to existing mock data code...
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
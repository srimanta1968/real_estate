import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import AuthModal from '../components/auth/AuthModal';
import AddToComparisonModal from '../components/common/AddToComparisonModal';

interface SearchResult {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  property_type: string | null;
  listing_status: string | null;
  year_built: number | null;
  lot_size: number | null;
  tax_amount: number | null;
  source_url?: string;
  source?: string;
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const fmt = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

const PROPERTY_TYPES = ['', 'Single Family', 'Multi Family', 'Condo', 'Townhouse', 'Commercial', 'Land'];
const LISTED_WITHIN_OPTIONS = [
  { value: '', label: 'Any Time' },
  { value: '5', label: '5 Days' },
  { value: '10', label: '10 Days' },
  { value: '30', label: '30 Days' },
  { value: '90', label: '90 Days' },
];
const US_STATES = ['','AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

interface SearchFilters { city: string; state: string; zip: string; propertyType: string; minPrice: string; maxPrice: string; listedWithin: string }
interface SiteConfig { name: string; buildUrl: (p: SearchFilters) => string }

const SITE_MAP: Record<string, SiteConfig[]> = {
  residential: [
    {
      name: 'Zillow',
      buildUrl: (p) => {
        const loc = p.zip || [p.city, p.state].filter(Boolean).join('-');
        let url = `https://www.zillow.com/homes/${encodeURIComponent(loc)}_rb/`;
        const fs: Record<string, unknown> = { sortSelection: { value: 'days' }, isAllHomes: { value: true } };
        const tm: Record<string, string> = { 'Single Family': 'Houses', 'Multi Family': 'Multi-family', 'Condo': 'Condos', 'Townhouse': 'Townhomes' };
        if (p.propertyType && tm[p.propertyType]) fs.homeType = { value: [tm[p.propertyType]] };
        if (p.minPrice || p.maxPrice) { fs.price = {}; if (p.minPrice) (fs.price as Record<string, number>).min = Number(p.minPrice); if (p.maxPrice) (fs.price as Record<string, number>).max = Number(p.maxPrice); }
        if (p.listedWithin) { const dm: Record<string, string> = { '5': '7', '10': '14', '30': '30', '90': '90' }; fs.doz = { value: dm[p.listedWithin] || p.listedWithin }; }
        return `${url}?searchQueryState=${encodeURIComponent(JSON.stringify({ filterState: fs }))}`;
      },
    },
    {
      name: 'Realtor.com',
      buildUrl: (p) => {
        let url = 'https://www.realtor.com/realestateandhomes-search/' + (p.zip || [p.city ? p.city.replace(/\s+/g, '-') : '', p.state].filter(Boolean).join('_'));
        const tm: Record<string, string> = { 'Single Family': 'type-single-family-home', 'Multi Family': 'type-multi-family-home', 'Condo': 'type-condo', 'Townhouse': 'type-townhome', 'Land': 'type-land' };
        if (p.propertyType && tm[p.propertyType]) url += `/${tm[p.propertyType]}`;
        if (p.minPrice || p.maxPrice) url += `/price-${p.minPrice || 'na'}-${p.maxPrice || 'na'}`;
        if (p.listedWithin) url += `/age-${p.listedWithin}d`;
        return url;
      },
    },
    {
      name: 'Redfin',
      buildUrl: (p) => {
        const base = p.zip ? `https://www.redfin.com/zipcode/${p.zip}` : `https://www.redfin.com/city/${p.state}/${(p.city || '').replace(/\s+/g, '-')}`;
        const f: string[] = [];
        const tm: Record<string, string> = { 'Single Family': 'property-type=1', 'Condo': 'property-type=2', 'Townhouse': 'property-type=3', 'Multi Family': 'property-type=4', 'Land': 'property-type=6' };
        if (p.propertyType && tm[p.propertyType]) f.push(tm[p.propertyType]);
        if (p.minPrice) f.push(`min-price=${p.minPrice}`);
        if (p.maxPrice) f.push(`max-price=${p.maxPrice}`);
        if (p.listedWithin) { const dm: Record<string, string> = { '5': '1wk', '10': '2wk', '30': '1mo', '90': '3mo' }; f.push(`time-on-redfin-less-than=${dm[p.listedWithin] || '1mo'}`); }
        return f.length > 0 ? `${base}/filter/${f.join(',')}` : base;
      },
    },
  ],
  commercial: [
    {
      name: 'LoopNet',
      buildUrl: (p) => {
        // Open the base national search page — the content script will
        // fill the location filter and submit, avoiding 404s from bad slugs.
        const tm: Record<string, string> = { 'Commercial': 'commercial-real-estate', 'Office': 'office-space', 'Retail': 'retail-space', 'Industrial': 'industrial-space', 'Multi Family': 'multifamily-housing', 'Shopping Center': 'shopping-centers', 'Hospitality': 'hotels-motels', 'Land': 'land' };
        const cat = tm[p.propertyType] || 'commercial-real-estate';
        const url = `https://www.loopnet.com/search/${cat}/for-sale/`;
        // Pass search criteria via hash — the content script reads it
        const loc = p.zip || [p.city, p.state].filter(Boolean).join(', ');
        const q = new URLSearchParams();
        if (p.minPrice) q.set('PriceRangeMin', p.minPrice);
        if (p.maxPrice) q.set('PriceRangeMax', p.maxPrice);
        if (p.listedWithin) { const dm: Record<string, string> = { '5': '2', '10': '2', '30': '3', '90': '4' }; q.set('e', dm[p.listedWithin] || '3'); }
        const qs = q.toString();
        const base = qs ? `${url}?${qs}` : url;
        return loc ? `${base}#dealeval-loc=${encodeURIComponent(loc)}` : base;
      },
    },
    {
      name: 'Crexi',
      buildUrl: (p) => {
        const tm: Record<string, string> = { 'Commercial': '', 'Office': 'Office', 'Retail': 'Retail', 'Industrial': 'Industrial', 'Multi Family': 'Multifamily', 'Land': 'Land' };
        const typePath = (p.propertyType && tm[p.propertyType]) || '';
        const segments = ['https://www.crexi.com/properties'];
        if (p.state) {
          segments.push(p.state.toUpperCase());
          if (p.city) segments.push(p.city.replace(/\s+/g, '_'));
        }
        let url = segments.join('/');
        if (typePath) url += `/${typePath}`;
        return url;
      },
    },
  ],
};

function getSitesForType(propertyType: string): SiteConfig[] {
  if (propertyType === 'Commercial') return SITE_MAP.commercial;
  if (['Single Family', 'Multi Family', 'Condo', 'Townhouse'].includes(propertyType)) return SITE_MAP.residential;
  return [...SITE_MAP.residential, ...SITE_MAP.commercial];
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [city, setCity] = useState(searchParams.get('city') || '');
  const [state, setState] = useState(searchParams.get('state') || '');
  const [zip, setZip] = useState(searchParams.get('zip') || '');
  const [propertyType, setPropertyType] = useState(searchParams.get('type') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [listedWithin, setListedWithin] = useState(searchParams.get('listedWithin') || '');

  const [results, setResults] = useState<SearchResponse | null>(null);
  const [siteResults, setSiteResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [siteSearching, setSiteSearching] = useState(false);
  const [siteSearchStatus, setSiteSearchStatus] = useState('');
  const [blockedSites, setBlockedSites] = useState<{ hostname: string; reason: string; message: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [comparePropertyId, setComparePropertyId] = useState('');
  const [comparePropertyAddress, setComparePropertyAddress] = useState('');
  const [compareSaving, setCompareSaving] = useState<string | null>(null);

  // Listen for external site search results from Chrome extension via localStorage
  useEffect(() => {
    const parseSiteResults = (stored: string | null): SearchResult[] => {
      if (!stored) return [];
      try {
        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed) || parsed.length === 0) return [];

        // Deduplicate by address (case-insensitive) on the display side
        const seen = new Set<string>();
        const unique: SearchResult[] = [];

        for (let i = 0; i < parsed.length; i++) {
          const r = parsed[i] as Record<string, unknown>;
          const addr = ((r.address as string) || '').toLowerCase().trim();

          // Skip duplicates, empty addresses, and page-title-like text
          if (!addr || addr.length < 4) continue;
          if (seen.has(addr)) continue;
          if (/commercial real estate|for sale|properties for|auctions/i.test(addr)) continue;

          seen.add(addr);
          unique.push({
            id: (r.id as string) || `site-${i}`,
            address: (r.address as string) || '',
            city: (r.city as string) || '',
            state: (r.state as string) || '',
            zip: (r.zip as string) || '',
            price: Number(r.price) || 0,
            beds: r.beds != null ? Number(r.beds) : null,
            baths: r.baths != null ? Number(r.baths) : null,
            sqft: r.sqft != null ? Number(r.sqft) : null,
            property_type: (r.property_type as string) || null,
            listing_status: null,
            year_built: r.year_built != null ? Number(r.year_built) : null,
            lot_size: null,
            tax_amount: null,
            source_url: (r.source_url as string) || undefined,
            source: (r.source as string) || undefined,
          });
        }
        return unique;
      } catch { return []; }
    };

    const loadSiteResults = () => {
      const results = parseSiteResults(localStorage.getItem('siteSearchResults'));
      if (results.length > 0) {
        setSiteResults(results);
        if (siteSearching) {
          setSiteSearching(false);
          setSiteSearchStatus(`Found ${results.length} listings from external sites`);
        }
      }
    };

    loadSiteResults();

    const handler = () => loadSiteResults();
    window.addEventListener('dealeval-site-results', handler);
    const blockedHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.sites) setBlockedSites(detail.sites);
    };
    window.addEventListener('dealeval-site-blocked', blockedHandler);
    const interval = setInterval(loadSiteResults, 2000);

    return () => {
      window.removeEventListener('dealeval-site-results', handler);
      window.removeEventListener('dealeval-site-blocked', blockedHandler);
      clearInterval(interval);
    };
  }, [siteSearching]);

  const handleSearch = async (p = 1) => {
    if (!city && !state && !zip) {
      setError('Enter at least a city, state, or zip code');
      return;
    }

    setLoading(true);
    setError(null);
    setPage(p);

    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (state) params.set('state', state);
    if (zip) params.set('zip', zip);
    if (propertyType) params.set('type', propertyType);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (listedWithin) params.set('listedWithin', listedWithin);
    params.set('page', String(p));

    setSearchParams(params);

    try {
      const res = await api.get(`/search?${params.toString()}`);
      setResults(res.data.data);
    } catch (err) {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchParams.get('city') || searchParams.get('state') || searchParams.get('zip')) {
      handleSearch();
    }
  }, []);

  const handleSearchOnSites = () => {
    if (!city && !state && !zip) return;

    // Clear previous external results
    localStorage.removeItem('siteSearchResults');
    localStorage.removeItem('siteSearchResultsTimestamp');
    setSiteResults([]);
    setBlockedSites([]);
    setSiteSearching(true);
    setSiteSearchStatus('Opening sites and scraping listings in background...');

    // Tell extension bridge to clear chrome.storage
    try { window.postMessage({ type: 'DEALEVAL_CLEAR_SITE_RESULTS' }, '*'); } catch {}

    const sites = getSitesForType(propertyType);
    const urls = sites.map(site => ({
      url: site.buildUrl({ city, state, zip, propertyType, minPrice, maxPrice, listedWithin }),
      hostname: site.name.toLowerCase().replace(/[^a-z.]/g, '') + '.com',
    }));

    // Tell the extension background worker to open tabs + scrape.
    // Listen for an ACK from the bridge; if none arrives within 1.5s,
    // fall back to window.open so tabs still open without the extension.
    let bridgeAcked = false;
    const ackHandler = (e: MessageEvent) => {
      if (e.data?.type === 'DEALEVAL_BRIDGE_ACK') bridgeAcked = true;
    };
    window.addEventListener('message', ackHandler);
    window.postMessage({ type: 'DEALEVAL_START_SITE_SEARCH', urls }, '*');

    setTimeout(() => {
      window.removeEventListener('message', ackHandler);
      if (!bridgeAcked) {
        // Extension bridge not responding — open tabs directly as fallback
        urls.forEach(u => { window.open(u.url, '_blank'); });
      }
    }, 1500);

    // Update status messages over time
    setTimeout(() => {
      if (siteSearching) setSiteSearchStatus(`Waiting for ${sites.map(s => s.name).join(', ')} to load...`);
    }, 3000);

    setTimeout(() => {
      if (siteSearching) setSiteSearchStatus('Scraping listing data from search results...');
    }, 6000);

    // Timeout after 30s - stop waiting
    setTimeout(() => {
      setSiteSearching(prev => {
        if (prev) {
          setSiteSearchStatus('');
          const current = localStorage.getItem('siteSearchResults');
          if (!current || JSON.parse(current).length === 0) {
            setSiteSearchStatus('No listings could be extracted. Sites may have blocked scraping. Try using the extension Extract tab on individual listings.');
          }
          return false;
        }
        return prev;
      });
    }, 30000);
  };

  const handleEvaluate = (result: SearchResult) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    sessionStorage.setItem('propertyInfo', JSON.stringify({
      address: result.address,
      purchase_price: String(result.price),
    }));
    if (result.tax_amount) {
      const existing = sessionStorage.getItem('expenseInfo');
      const expense = existing ? JSON.parse(existing) : {};
      expense.property_tax = String(result.tax_amount);
      sessionStorage.setItem('expenseInfo', JSON.stringify(expense));
    }
    window.location.href = '/property/new';
  };

  const handleCompare = async (result: SearchResult) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    setCompareSaving(result.id);
    try {
      const res = await api.post('/saved-properties/save', {
        property_name: result.address || 'Untitled Property',
        property_data: { address: result.address, purchase_price: String(result.price) },
        financing_data: {},
        expense_data: result.tax_amount ? { property_tax: String(result.tax_amount) } : {},
      });
      setComparePropertyId(res.data.data.savedProperty.id);
      setComparePropertyAddress(result.address);
      setCompareModalOpen(true);
    } catch {
      alert('Failed to save property for comparison');
    } finally {
      setCompareSaving(null);
    }
  };

  return (
    <div>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Search Properties</h1>
          <p className="mt-1 text-gray-500">Find properties by location, type, and price range</p>
        </div>

        {/* Extension Install Banner */}
        {siteResults.length === 0 && !siteSearching && (
          <div className="mb-6 px-5 py-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-emerald-800">Install the DealEval Chrome Extension for best results</p>
              <p className="text-xs text-emerald-600 mt-0.5">
                The extension auto-extracts property data from Zillow, Realtor.com, LoopNet, Crexi, and more. Without it, search results are limited to our API sources.
              </p>
            </div>
            <a
              href="https://chrome.google.com/webstore"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700"
            >
              Get Extension
            </a>
          </div>
        )}

        {/* Search Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="e.g. Austin"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">State</label>
              <select
                value={state}
                onChange={e => setState(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {US_STATES.map(s => <option key={s} value={s}>{s || 'Any'}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Zip Code</label>
              <input
                type="text"
                value={zip}
                onChange={e => setZip(e.target.value)}
                placeholder="e.g. 78701"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
              <select
                value={propertyType}
                onChange={e => setPropertyType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t || 'Any'}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Min Price</label>
              <input
                type="number"
                value={minPrice}
                onChange={e => setMinPrice(e.target.value)}
                placeholder="$0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Max Price</label>
              <input
                type="number"
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
                placeholder="No max"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Listed Within</label>
              <select
                value={listedWithin}
                onChange={e => setListedWithin(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {LISTED_WITHIN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => handleSearch(1)}
              disabled={loading}
              className="bg-indigo-600 text-white px-8 py-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search Properties'}
            </button>
            {isAuthenticated && (
              <button
                onClick={async () => {
                  try {
                    await api.post('/search/save-query', { city, state, zip, propertyType, minPrice: minPrice ? Number(minPrice) : undefined, maxPrice: maxPrice ? Number(maxPrice) : undefined });
                  } catch {}
                }}
                className="border border-gray-300 text-gray-600 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Save Search
              </button>
            )}
            {(city || state || zip) && (
              <button
                onClick={handleSearchOnSites}
                disabled={siteSearching}
                className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-wait"
              >
                {siteSearching ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Extracting from Sites...
                  </span>
                ) : (
                  `Search on Sites (${getSitesForType(propertyType).map(s => s.name).join(', ')})`
                )}
              </button>
            )}
          </div>

          {/* Site search progress banner */}
          {(siteSearching || siteSearchStatus) && (
            <div className={`mt-4 flex items-center gap-3 px-4 py-3 rounded-lg text-sm ${siteSearching ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : siteSearchStatus.includes('No listings') ? 'bg-amber-50 border border-amber-200 text-amber-800' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'}`}>
              {siteSearching && (
                <svg className="animate-spin h-4 w-4 text-emerald-600 flex-shrink-0" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              )}
              <span>{siteSearchStatus}</span>
              {!siteSearching && siteSearchStatus && (
                <button onClick={() => setSiteSearchStatus('')} className="ml-auto text-gray-400 hover:text-gray-600">&times;</button>
              )}
            </div>
          )}

          {/* Blocked sites warning */}
          {blockedSites.length > 0 && (
            <div className="mt-3 bg-amber-50 border border-amber-300 rounded-lg px-4 py-3 text-sm text-amber-900">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                <div>
                  <p className="font-semibold mb-1">Some sites blocked scraping:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {blockedSites.map((s, i) => (
                      <li key={i}>
                        <span className="font-medium">{s.hostname}</span> — {s.message}
                        {s.reason === 'captcha' && (
                          <span className="text-amber-700 ml-1">(tab opened — solve the CAPTCHA then click "Search on Sites" again)</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
                <button onClick={() => setBlockedSites([])} className="ml-auto text-amber-400 hover:text-amber-600 flex-shrink-0">&times;</button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Results */}
        {results && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {results.total} {results.total === 1 ? 'property' : 'properties'} found
              </p>
            </div>

            {results.results.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="text-gray-300 text-5xl mb-4">&#128270;</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No properties found in local database</h3>
                <p className="text-gray-500 mb-4">
                  {propertyType === 'Commercial'
                    ? 'Commercial listings are available on LoopNet and Crexi. Use "Search on Sites" to browse them, then extract listings with the DealEval extension.'
                    : 'Try adjusting your search filters, or use "Search on Sites" to browse listings on Zillow, Realtor.com, and Redfin.'}
                </p>
                {(city || state || zip) && (
                  <button
                    onClick={handleSearchOnSites}
                    disabled={siteSearching}
                    className="bg-emerald-600 text-white px-8 py-2.5 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-wait"
                  >
                    {siteSearching ? (
                      <span className="flex items-center gap-2 justify-center">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                        Extracting from Sites...
                      </span>
                    ) : (
                      `Search on ${getSitesForType(propertyType).map(s => s.name).join(', ')}`
                    )}
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.results.map(result => (
                  <div key={result.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-5 py-3 flex items-center justify-between">
                      <h3 className="text-white font-semibold truncate text-sm" title={result.address}>
                        {result.address}
                      </h3>
                      {result.listing_status && (
                        <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
                          {result.listing_status}
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <p className="text-2xl font-bold text-gray-900 mb-3">{fmt(result.price)}</p>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {result.beds !== null && (
                          <div className="text-center">
                            <p className="text-sm font-semibold text-gray-900">{result.beds}</p>
                            <p className="text-xs text-gray-400">Beds</p>
                          </div>
                        )}
                        {result.baths !== null && (
                          <div className="text-center">
                            <p className="text-sm font-semibold text-gray-900">{result.baths}</p>
                            <p className="text-xs text-gray-400">Baths</p>
                          </div>
                        )}
                        {result.sqft !== null && (
                          <div className="text-center">
                            <p className="text-sm font-semibold text-gray-900">{result.sqft.toLocaleString()}</p>
                            <p className="text-xs text-gray-400">Sqft</p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                        <span>{result.city}, {result.state} {result.zip}</span>
                        {result.property_type && <span>| {result.property_type}</span>}
                        {result.year_built && <span>| Built {result.year_built}</span>}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEvaluate(result)}
                          className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
                        >
                          Evaluate Property
                        </button>
                        <button
                          onClick={() => handleCompare(result)}
                          disabled={compareSaving === result.id}
                          className="px-3 py-2 border border-indigo-300 text-indigo-600 rounded-lg text-sm font-semibold hover:bg-indigo-50 transition-colors disabled:opacity-50"
                          title="Add to comparison set"
                        >
                          {compareSaving === result.id ? '...' : 'Compare'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {results.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => handleSearch(page - 1)}
                  disabled={page <= 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-30 hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm text-gray-600">
                  Page {page} of {results.totalPages}
                </span>
                <button
                  onClick={() => handleSearch(page + 1)}
                  disabled={page >= results.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-30 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* External Site Results from Chrome Extension */}
        {siteResults.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">External Site Results</h2>
                <p className="text-sm text-gray-500">
                  {siteResults.length} {siteResults.length === 1 ? 'listing' : 'listings'} scraped from external sites via DealEval extension
                </p>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('siteSearchResults');
                  localStorage.removeItem('siteSearchResultsTimestamp');
                  setSiteResults([]);
                }}
                className="text-sm text-red-500 hover:text-red-700 font-medium"
              >
                Clear Results
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {siteResults.map(result => (
                <div key={result.id} className="bg-white rounded-xl shadow-sm border border-emerald-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-3 flex items-center justify-between">
                    <h3 className="text-white font-semibold truncate text-sm" title={result.address}>
                      {result.address || 'Unknown Address'}
                    </h3>
                    {result.property_type && (
                      <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
                        {result.property_type}
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    {result.price > 0 && (
                      <p className="text-2xl font-bold text-gray-900 mb-3">{fmt(result.price)}</p>
                    )}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {result.beds !== null && (
                        <div className="text-center">
                          <p className="text-sm font-semibold text-gray-900">{result.beds}</p>
                          <p className="text-xs text-gray-400">Beds</p>
                        </div>
                      )}
                      {result.baths !== null && (
                        <div className="text-center">
                          <p className="text-sm font-semibold text-gray-900">{result.baths}</p>
                          <p className="text-xs text-gray-400">Baths</p>
                        </div>
                      )}
                      {result.sqft !== null && (
                        <div className="text-center">
                          <p className="text-sm font-semibold text-gray-900">{result.sqft.toLocaleString()}</p>
                          <p className="text-xs text-gray-400">Sqft</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                      {result.city && <span>{result.city}{result.state ? `, ${result.state}` : ''} {result.zip || ''}</span>}
                    </div>
                    {result.source_url && (
                      <a
                        href={result.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-800 font-medium mb-3 truncate"
                        title={result.source_url}
                      >
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        View on {result.source ? result.source.replace('.com', '').replace(/^\w/, (c: string) => c.toUpperCase()) + '.com' : 'Source'}
                      </a>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEvaluate(result)}
                        className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors"
                      >
                        Evaluate Property
                      </button>
                      <button
                        onClick={() => handleCompare(result)}
                        disabled={compareSaving === result.id}
                        className="px-3 py-2 border border-emerald-300 text-emerald-600 rounded-lg text-sm font-semibold hover:bg-emerald-50 transition-colors disabled:opacity-50"
                        title="Add to comparison set"
                      >
                        {compareSaving === result.id ? '...' : 'Compare'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <AddToComparisonModal
        isOpen={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        savedPropertyId={comparePropertyId}
        propertyAddress={comparePropertyAddress}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
      />
    </div>
  );
}

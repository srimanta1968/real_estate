import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import AuthModal from '../components/auth/AuthModal';

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

const SITE_MAP: Record<string, { name: string; buildUrl: (p: { city: string; state: string; zip: string }) => string }[]> = {
  residential: [
    { name: 'Zillow', buildUrl: (p) => `https://www.zillow.com/homes/${p.city ? p.city + '-' : ''}${p.state}_rb/` },
    { name: 'Realtor.com', buildUrl: (p) => `https://www.realtor.com/realestateandhomes-search/${p.city ? p.city.replace(/\s+/g, '-') + '_' : ''}${p.state}` },
    { name: 'Redfin', buildUrl: (p) => `https://www.redfin.com/zipcode/${p.zip || ''}` },
  ],
  commercial: [
    { name: 'LoopNet', buildUrl: (p) => `https://www.loopnet.com/search/commercial-real-estate/${p.city ? p.city.toLowerCase() + '-' : ''}${p.state ? p.state.toLowerCase() : ''}/for-sale/` },
    { name: 'Crexi', buildUrl: (p) => { const params = new URLSearchParams(); if (p.city) params.set('city', p.city); if (p.state) params.set('state', p.state); return `https://www.crexi.com/properties?${params.toString()}`; } },
  ],
};

function getSitesForType(propertyType: string) {
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

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

  return (
    <div>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Search Properties</h1>
          <p className="mt-1 text-gray-500">Find properties by location, type, and price range</p>
        </div>

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
                onClick={() => {
                  const sites = getSitesForType(propertyType);
                  sites.forEach(site => {
                    const url = site.buildUrl({ city, state, zip });
                    window.open(url, '_blank');
                  });
                }}
                className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
              >
                Search on Sites ({getSitesForType(propertyType).map(s => s.name).join(', ')})
              </button>
            )}
          </div>
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
                    onClick={() => {
                      const sites = getSitesForType(propertyType);
                      sites.forEach(site => {
                        const url = site.buildUrl({ city, state, zip });
                        window.open(url, '_blank');
                      });
                    }}
                    className="bg-emerald-600 text-white px-8 py-2.5 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
                  >
                    Search on {getSitesForType(propertyType).map(s => s.name).join(', ')}
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
                      <button
                        onClick={() => handleEvaluate(result)}
                        className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
                      >
                        Evaluate Property
                      </button>
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
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
      />
    </div>
  );
}

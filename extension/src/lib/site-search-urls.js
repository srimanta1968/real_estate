/**
 * Site Search URL Builders
 * Maps property types to real estate site categories and builds search URLs
 * for each supported site. Each builder maps ALL filters (type, price, date)
 * to the site's native URL/query parameter format.
 */

const RESIDENTIAL_SITES = {
  zillow: {
    name: 'Zillow',
    hostname: 'zillow.com',
    /**
     * Zillow URL format: /homes/{location}_rb/?searchQueryState={JSON}
     * Filters: price (min/max), doz (days on Zillow), homeType
     */
    buildSearchUrl({ city, state, zip, propertyType, minPrice, maxPrice, listedWithin }) {
      const location = zip || [city, state].filter(Boolean).join('-');
      let url = `https://www.zillow.com/homes/${encodeURIComponent(location)}_rb/`;

      const filterState = { sortSelection: { value: 'days' }, isAllHomes: { value: true } };

      // Property type mapping
      const typeMap = {
        'Single Family': 'Houses',
        'Multi Family': 'Multi-family',
        'Condo': 'Condos',
        'Townhouse': 'Townhomes',
      };
      if (propertyType && typeMap[propertyType]) {
        filterState.homeType = { value: [typeMap[propertyType]] };
      }

      // Price range
      if (minPrice || maxPrice) {
        filterState.price = {};
        if (minPrice) filterState.price.min = Number(minPrice);
        if (maxPrice) filterState.price.max = Number(maxPrice);
      }

      // Days on Zillow: 1=24hr, 7=7d, 14=14d, 30=30d, 90=90d
      if (listedWithin) {
        const dozMap = { '5': '7', '10': '14', '30': '30', '90': '90' };
        filterState.doz = { value: dozMap[String(listedWithin)] || String(listedWithin) };
      }

      const params = new URLSearchParams();
      params.set('searchQueryState', JSON.stringify({ filterState }));
      return `${url}?${params.toString()}`;
    },
  },

  realtor: {
    name: 'Realtor.com',
    hostname: 'realtor.com',
    /**
     * Realtor.com URL format: /realestateandhomes-search/{location}/type-{type}/price-{min}-{max}/age-{days}d
     * All filters go in the URL path segments
     */
    buildSearchUrl({ city, state, zip, propertyType, minPrice, maxPrice, listedWithin }) {
      let url = 'https://www.realtor.com/realestateandhomes-search/';

      // Location
      if (zip) {
        url += zip;
      } else {
        url += [city ? city.replace(/\s+/g, '-') : '', state].filter(Boolean).join('_');
      }

      // Property type
      const typeMap = {
        'Single Family': 'type-single-family-home',
        'Multi Family': 'type-multi-family-home',
        'Condo': 'type-condo',
        'Townhouse': 'type-townhome',
        'Land': 'type-land',
      };
      if (propertyType && typeMap[propertyType]) {
        url += `/${typeMap[propertyType]}`;
      }

      // Price range
      if (minPrice || maxPrice) {
        url += `/price-${minPrice || 'na'}-${maxPrice || 'na'}`;
      }

      // Days on market: age-Xd
      if (listedWithin) {
        url += `/age-${listedWithin}d`;
      }

      return url;
    },
  },

  redfin: {
    name: 'Redfin',
    hostname: 'redfin.com',
    /**
     * Redfin URL format: /zipcode/{zip}/filter/property-type={type},min-price={min},max-price={max},hoa={days}
     * Filters go in /filter/ path segment as key=value pairs
     */
    buildSearchUrl({ city, state, zip, propertyType, minPrice, maxPrice, listedWithin }) {
      let base;
      if (zip) {
        base = `https://www.redfin.com/zipcode/${zip}`;
      } else {
        const citySlug = city ? city.replace(/\s+/g, '-') : '';
        base = `https://www.redfin.com/city/${state}/${citySlug}`;
      }

      const filters = [];

      // Property type: 1=house, 2=condo, 3=townhouse, 4=multi-family, 6=land
      const typeMap = {
        'Single Family': 'property-type=1',
        'Condo': 'property-type=2',
        'Townhouse': 'property-type=3',
        'Multi Family': 'property-type=4',
        'Land': 'property-type=6',
      };
      if (propertyType && typeMap[propertyType]) {
        filters.push(typeMap[propertyType]);
      }

      // Price
      if (minPrice) filters.push(`min-price=${minPrice}`);
      if (maxPrice) filters.push(`max-price=${maxPrice}`);

      // Days on market: include=sold-{days}d / time-on-redfin-{days}
      if (listedWithin) {
        const dayMap = { '5': '1wk', '10': '2wk', '30': '1mo', '90': '3mo' };
        filters.push(`time-on-redfin-less-than=${dayMap[String(listedWithin)] || '1mo'}`);
      }

      if (filters.length > 0) {
        return `${base}/filter/${filters.join(',')}`;
      }
      return base;
    },
  },

  trulia: {
    name: 'Trulia',
    hostname: 'trulia.com',
    /**
     * Trulia URL format: /{state}/{city}/{type}_for_sale/{price}/ + query params
     * Filters: type in path, price and date as query params
     */
    buildSearchUrl({ city, state, zip, propertyType, minPrice, maxPrice, listedWithin }) {
      let base;
      if (zip) {
        base = `https://www.trulia.com/${state}/${zip}/`;
      } else {
        const citySlug = city ? city.toLowerCase().replace(/\s+/g, '-') : '';
        base = `https://www.trulia.com/${state}/${citySlug}/`;
      }

      // Property type in path
      const typeMap = {
        'Single Family': 'single_family_home',
        'Multi Family': 'multi_family',
        'Condo': 'condo',
        'Townhouse': 'townhouse',
        'Land': 'land',
      };
      if (propertyType && typeMap[propertyType]) {
        base += `${typeMap[propertyType]}_for_sale/`;
      }

      // Price and date as query params
      const params = new URLSearchParams();
      if (minPrice) params.set('price_min', String(minPrice));
      if (maxPrice) params.set('price_max', String(maxPrice));
      if (listedWithin) {
        const dayMap = { '5': '7', '10': '14', '30': '30', '90': '90' };
        params.set('listed_within', dayMap[String(listedWithin)] || String(listedWithin));
      }

      const qs = params.toString();
      return qs ? `${base}?${qs}` : base;
    },
  },
};

const COMMERCIAL_SITES = {
  loopnet: {
    name: 'LoopNet',
    hostname: 'loopnet.com',
    /**
     * LoopNet filter params (from Angular ng-model bindings):
     *   criteria.PriceRangeMin / PriceRangeMax → price
     *   criteria.BuildingSizeRangeMin / Max → building sqft
     *   criteria.LotSizeRangeMin / Max → lot acres
     *   criteria.UnitCountRangeMin / Max → units
     *   Property type categories (bitwise): 32=Office, 1=Industrial, 2=Retail,
     *     4=Shopping Center, 8=Multi-Family, 16=Hospitality, 512=Land, 64=Special Purpose
     *   e= → listing age: 1=24h, 2=lastWeek, 3=lastMonth, 4=last3Mo
     *
     * URL format: /search/{category-slug}/{location}/for-sale/?PriceRangeMin=X&PriceRangeMax=X&e=X&BuildingSizeRangeMin=X
     */
    buildSearchUrl({ city, state, zip, propertyType, minPrice, maxPrice, listedWithin, minSqft, maxSqft }) {
      // Property type → URL path category slug
      const typeMap = {
        'Commercial': 'commercial-real-estate',
        'Office': 'office-space',
        'Retail': 'retail-space',
        'Industrial': 'industrial-space',
        'Multi Family': 'multifamily-housing',
        'Shopping Center': 'shopping-centers',
        'Hospitality': 'hotels-motels',
        'Special Purpose': 'special-purpose',
        'Land': 'land',
      };
      const category = typeMap[propertyType] || 'commercial-real-estate';

      // Location
      let location;
      if (zip) {
        location = zip;
      } else {
        location = [city, state].filter(Boolean).join('-').toLowerCase().replace(/\s+/g, '-');
      }

      let url = `https://www.loopnet.com/search/${category}/${location}/for-sale/`;

      // Query params matching LoopNet's Angular criteria model
      const params = new URLSearchParams();

      // Price (criteria.PriceRangeMin / PriceRangeMax)
      if (minPrice) params.set('PriceRangeMin', String(minPrice));
      if (maxPrice) params.set('PriceRangeMax', String(maxPrice));

      // Building size in SF (criteria.BuildingSizeRangeMin / Max)
      if (minSqft) params.set('BuildingSizeRangeMin', String(minSqft));
      if (maxSqft) params.set('BuildingSizeRangeMax', String(maxSqft));

      // Listing age: e= param
      // 1=Last 24 Hours, 2=Last Week, 3=Last Month, 4=Last 3 Months
      if (listedWithin) {
        const dayMap = { '5': '2', '10': '2', '30': '3', '90': '4' };
        params.set('e', dayMap[String(listedWithin)] || '3');
      }

      const qs = params.toString();
      return qs ? `${url}?${qs}` : url;
    },
  },

  crexi: {
    name: 'Crexi',
    hostname: 'crexi.com',
    /**
     * Crexi URL format: /properties/{STATE}/{City_Name}/{PropertyType}
     * Location and property type go in the path; city uses underscores for spaces.
     * Crexi does NOT support query-param-based location filtering.
     */
    buildSearchUrl({ city, state, zip, propertyType }) {
      // Property type mapping to Crexi path slugs
      const typeMap = {
        'Commercial': '',
        'Office': 'Office',
        'Retail': 'Retail',
        'Industrial': 'Industrial',
        'Multi Family': 'Multifamily',
        'Land': 'Land',
      };
      const typePath = (propertyType && typeMap[propertyType]) || '';

      // Build path: /properties/{STATE}/{City_Name}/{Type}
      const segments = ['https://www.crexi.com/properties'];

      if (state) {
        segments.push(state.toUpperCase());

        // City slug: replace spaces with underscores (e.g. "San Jose" → "San_Jose")
        if (city) {
          segments.push(city.replace(/\s+/g, '_'));
        }
      }

      let url = segments.join('/');

      // Append property type as final path segment
      if (typePath) {
        url += `/${typePath}`;
      }

      // Pass location via hash so the content script can fill the search input
      const loc = zip || [city, state].filter(Boolean).join(', ');
      if (loc) url += `#dealeval-loc=${encodeURIComponent(loc)}`;

      return url;
    },
  },

  commercialcafe: {
    name: 'CommercialCafe',
    hostname: 'commercialcafe.com',
    /**
     * CommercialCafe URL format: /commercial-real-estate/us/{state}/{city}/?PropertyType={type}&PriceMin={min}
     */
    buildSearchUrl({ city, state, zip, propertyType, minPrice, maxPrice }) {
      const stateSlug = state ? state.toLowerCase() : '';
      const citySlug = city ? city.toLowerCase().replace(/\s+/g, '-') : '';
      let base = `https://www.commercialcafe.com/commercial-real-estate/us/${stateSlug}/${citySlug}/`;

      const params = new URLSearchParams();

      const typeMap = {
        'Office': 'office',
        'Retail': 'retail',
        'Industrial': 'industrial',
        'Land': 'land',
      };
      if (propertyType && typeMap[propertyType]) {
        params.set('PropertyType', typeMap[propertyType]);
      }

      if (minPrice) params.set('PriceMin', String(minPrice));
      if (maxPrice) params.set('PriceMax', String(maxPrice));

      const qs = params.toString();
      return qs ? `${base}?${qs}` : base;
    },
  },
};

/**
 * Property type to site category mapping.
 */
const TYPE_TO_CATEGORY = {
  'Single Family': 'residential',
  'Multi Family': 'residential',
  'Condo': 'residential',
  'Townhouse': 'residential',
  'Commercial': 'commercial',
};

/**
 * Get the list of sites for a given property type.
 */
function getSitesForPropertyType(propertyType) {
  const category = TYPE_TO_CATEGORY[propertyType];
  if (category === 'residential') return Object.values(RESIDENTIAL_SITES);
  if (category === 'commercial') return Object.values(COMMERCIAL_SITES);
  return [...Object.values(RESIDENTIAL_SITES), ...Object.values(COMMERCIAL_SITES)];
}

/**
 * Build search URLs for all relevant sites based on property type and search criteria.
 */
function buildSearchUrls(params) {
  const sites = getSitesForPropertyType(params.propertyType);
  return sites.map(site => ({
    name: site.name,
    hostname: site.hostname,
    url: site.buildSearchUrl(params),
  }));
}

/**
 * Get all available site names grouped by category.
 */
function getAllSiteNames() {
  return {
    residential: Object.values(RESIDENTIAL_SITES).map(s => s.name),
    commercial: Object.values(COMMERCIAL_SITES).map(s => s.name),
  };
}

if (typeof window !== 'undefined') {
  window.SiteSearchUrls = {
    RESIDENTIAL_SITES,
    COMMERCIAL_SITES,
    TYPE_TO_CATEGORY,
    getSitesForPropertyType,
    buildSearchUrls,
    getAllSiteNames,
  };
}

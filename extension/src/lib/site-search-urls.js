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
     * LoopNet URL format: /search/{category}/{location}/for-sale/?Filters={encoded}
     * Categories: commercial-real-estate, office-space, retail-space, industrial-space, etc.
     * Price/date filters go as encoded query params
     */
    buildSearchUrl({ city, state, zip, propertyType, minPrice, maxPrice, listedWithin }) {
      // Property type → category slug
      const typeMap = {
        'Commercial': 'commercial-real-estate',
        'Office': 'office-space',
        'Retail': 'retail-space',
        'Industrial': 'industrial-space',
        'Multi Family': 'multifamily-housing',
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

      // Price and date filters as query params
      const params = new URLSearchParams();
      if (minPrice) params.set('PriceMin', String(minPrice));
      if (maxPrice) params.set('PriceMax', String(maxPrice));

      // Days on market
      if (listedWithin) {
        const dayMap = { '5': '1', '10': '2', '30': '3', '90': '4' };
        // LoopNet uses e= param: 1=last24h, 2=lastWeek, 3=lastMonth, 4=last3Mo
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
     * Crexi URL format: /properties?state={ST}&propertyTypes={types}&priceMin={min}&priceMax={max}&listedWithin={days}
     * All filters as query parameters
     */
    buildSearchUrl({ city, state, zip, propertyType, minPrice, maxPrice, listedWithin }) {
      const params = new URLSearchParams();

      // Location
      if (state) params.set('state', state);
      if (city) params.set('city', city);
      if (zip) params.set('zip', zip);

      // Property type mapping to Crexi categories
      const typeMap = {
        'Commercial': 'commercial',
        'Office': 'office',
        'Retail': 'retail',
        'Industrial': 'industrial',
        'Multi Family': 'multifamily',
        'Land': 'land',
      };
      if (propertyType && typeMap[propertyType]) {
        params.set('propertyTypes', typeMap[propertyType]);
      }

      // Price range
      if (minPrice) params.set('priceMin', String(minPrice));
      if (maxPrice) params.set('priceMax', String(maxPrice));

      // Listed within days
      if (listedWithin) params.set('listedWithin', String(listedWithin));

      return `https://www.crexi.com/properties?${params.toString()}`;
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

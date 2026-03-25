/**
 * Site Search URL Builders
 * Maps property types to real estate site categories and builds search URLs
 * for each supported site based on user search criteria.
 */

const RESIDENTIAL_SITES = {
  zillow: {
    name: 'Zillow',
    hostname: 'zillow.com',
    buildSearchUrl({ city, state, zip, minPrice, maxPrice, listedWithin }) {
      if (zip) {
        return `https://www.zillow.com/homes/${zip}_rb/`;
      }
      const location = [city, state].filter(Boolean).join('-');
      let url = `https://www.zillow.com/homes/${encodeURIComponent(location)}_rb/`;
      const params = new URLSearchParams();
      if (minPrice || maxPrice || listedWithin) {
        const filterState = {};
        if (minPrice || maxPrice) {
          filterState.price = {};
          if (minPrice) filterState.price.min = Number(minPrice);
          if (maxPrice) filterState.price.max = Number(maxPrice);
        }
        if (listedWithin) {
          const dozMap = { 5: '7', 10: '14', 30: '30', 90: '90' };
          filterState.doz = dozMap[String(listedWithin)] || String(listedWithin);
        }
        params.set('searchQueryState', JSON.stringify({ filterState }));
      }
      const qs = params.toString();
      return qs ? `${url}?${qs}` : url;
    },
  },

  realtor: {
    name: 'Realtor.com',
    hostname: 'realtor.com',
    buildSearchUrl({ city, state, zip, propertyType, minPrice, maxPrice, listedWithin }) {
      let url = 'https://www.realtor.com/realestateandhomes-search/';
      if (zip) {
        url += zip;
      } else {
        const loc = [city ? city.replace(/\s+/g, '-') : '', state].filter(Boolean).join('_');
        url += loc;
      }
      const typeMap = {
        'Single Family': 'type-single-family-home',
        'Multi Family': 'type-multi-family-home',
        'Condo': 'type-condo',
        'Townhouse': 'type-townhome',
      };
      if (propertyType && typeMap[propertyType]) {
        url += `/${typeMap[propertyType]}`;
      }
      if (minPrice || maxPrice) {
        url += `/price-${minPrice || 'na'}-${maxPrice || 'na'}`;
      }
      if (listedWithin) {
        url += `/age-${listedWithin}d`;
      }
      return url;
    },
  },

  redfin: {
    name: 'Redfin',
    hostname: 'redfin.com',
    buildSearchUrl({ city, state, zip }) {
      if (zip) {
        return `https://www.redfin.com/zipcode/${zip}`;
      }
      const citySlug = city ? city.replace(/\s+/g, '-') : '';
      return `https://www.redfin.com/city/${state}/${citySlug}`;
    },
  },

  trulia: {
    name: 'Trulia',
    hostname: 'trulia.com',
    buildSearchUrl({ city, state, zip }) {
      if (zip) {
        return `https://www.trulia.com/${state}/${zip}/`;
      }
      const citySlug = city ? city.toLowerCase().replace(/\s+/g, '-') : '';
      return `https://www.trulia.com/${state}/${citySlug}/`;
    },
  },
};

const COMMERCIAL_SITES = {
  loopnet: {
    name: 'LoopNet',
    hostname: 'loopnet.com',
    buildSearchUrl({ city, state, propertyType }) {
      const typeMap = {
        'Commercial': 'commercial-real-estate',
        'Office': 'office-space',
        'Retail': 'retail-space',
        'Industrial': 'industrial-space',
      };
      const category = typeMap[propertyType] || 'commercial-real-estate';
      const location = [city, state].filter(Boolean).join('-').toLowerCase().replace(/\s+/g, '-');
      return `https://www.loopnet.com/search/${category}/${location}/for-sale/`;
    },
  },

  crexi: {
    name: 'Crexi',
    hostname: 'crexi.com',
    buildSearchUrl({ city, state, minPrice, maxPrice }) {
      const params = new URLSearchParams();
      if (city) params.set('city', city);
      if (state) params.set('state', state);
      if (minPrice) params.set('priceMin', String(minPrice));
      if (maxPrice) params.set('priceMax', String(maxPrice));
      return `https://www.crexi.com/properties?${params.toString()}`;
    },
  },

  commercialcafe: {
    name: 'CommercialCafe',
    hostname: 'commercialcafe.com',
    buildSearchUrl({ city, state }) {
      const stateSlug = state ? state.toLowerCase() : '';
      const citySlug = city ? city.toLowerCase().replace(/\s+/g, '-') : '';
      return `https://www.commercialcafe.com/commercial-real-estate/us/${stateSlug}/${citySlug}/`;
    },
  },
};

/**
 * Property type to site category mapping.
 * Residential types go to residential sites, Commercial to commercial sites.
 * Land and empty (Any) search both.
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
 * @param {string} propertyType - The selected property type
 * @returns {Object[]} Array of site config objects
 */
function getSitesForPropertyType(propertyType) {
  const category = TYPE_TO_CATEGORY[propertyType];
  if (category === 'residential') return Object.values(RESIDENTIAL_SITES);
  if (category === 'commercial') return Object.values(COMMERCIAL_SITES);
  return [...Object.values(RESIDENTIAL_SITES), ...Object.values(COMMERCIAL_SITES)];
}

/**
 * Build search URLs for all relevant sites based on property type and search criteria.
 * @param {Object} params - Search parameters
 * @param {string} params.city
 * @param {string} params.state
 * @param {string} params.zip
 * @param {string} params.propertyType
 * @param {number|string} params.minPrice
 * @param {number|string} params.maxPrice
 * @param {number|string} params.listedWithin
 * @returns {{ name: string, url: string, hostname: string }[]}
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
 * @returns {{ residential: string[], commercial: string[] }}
 */
function getAllSiteNames() {
  return {
    residential: Object.values(RESIDENTIAL_SITES).map(s => s.name),
    commercial: Object.values(COMMERCIAL_SITES).map(s => s.name),
  };
}

// Export for use in extension popup and background scripts
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

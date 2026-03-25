import { config } from '../config/env';
import { DataService } from './data.service';

interface SearchParams {
  city?: string;
  state?: string;
  zip?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  listedWithin?: number;
  page?: number;
  limit?: number;
}

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

interface PropertySearchRecord {
  id: string;
  user_id: string | null;
  query: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  property_type: string | null;
  min_price: number | null;
  max_price: number | null;
  results_count: number;
  created_at: string;
}

interface ExtractedListingRecord {
  id: string;
  user_id: string;
  source: string;
  source_url: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  lot_size: number | null;
  year_built: number | null;
  property_type: string | null;
  tax_amount: number | null;
  hoa: number | null;
  listing_status: string | null;
  raw_data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Property search service using external API (RentCast/ATTOM/RealtyMole)
 * and local extracted_listings table.
 */
export const SearchService = {
  /**
   * Search properties via external API
   */
  async search(params: SearchParams, userId?: string): Promise<SearchResponse> {
    try {
      const page = params.page || 1;
      const limit = Math.min(params.limit || 20, 50);
      const offset = (page - 1) * limit;

      const results = await this.fetchFromProvider(params, limit, offset);

      const queryStr = [params.city, params.state, params.zip].filter(Boolean).join(', ');
      await DataService.insertOne<PropertySearchRecord>('property_searches', {
        user_id: userId || null,
        query: queryStr,
        city: params.city || null,
        state: params.state || null,
        zip: params.zip || null,
        property_type: params.propertyType || null,
        min_price: params.minPrice || null,
        max_price: params.maxPrice || null,
        results_count: results.length,
      });

      return {
        results,
        total: results.length,
        page,
        limit,
        totalPages: Math.ceil(results.length / limit) || 1,
      };
    } catch (error) {
      console.error('SearchService search error:', error);
      throw error;
    }
  },

  /**
   * Fetch listings from configured property API provider
   */
  async fetchFromProvider(params: SearchParams, limit: number, offset: number): Promise<SearchResult[]> {
    try {
      const { provider, apiKey } = config.propertyApi;

      if (!apiKey) {
        return this.fetchFromLocalListings(params, limit, offset);
      }

      const queryParams = new URLSearchParams();
      if (params.city) queryParams.set('city', params.city);
      if (params.state) queryParams.set('state', params.state);
      if (params.zip) queryParams.set('zipCode', params.zip);
      if (params.minPrice) queryParams.set('minPrice', String(params.minPrice));
      if (params.maxPrice) queryParams.set('maxPrice', String(params.maxPrice));
      if (params.propertyType) queryParams.set('propertyType', params.propertyType);
      if (params.listedWithin) queryParams.set('daysOld', String(params.listedWithin));
      queryParams.set('limit', String(limit));
      queryParams.set('offset', String(offset));

      let url = '';
      const headers: Record<string, string> = {};

      if (provider === 'rentcast') {
        url = `https://api.rentcast.io/v1/listings/sale?${queryParams.toString()}`;
        headers['X-Api-Key'] = apiKey;
      } else if (provider === 'attom') {
        url = `https://api.gateway.attomdata.com/propertyapi/v1.0.0/sale/snapshot?${queryParams.toString()}`;
        headers['apikey'] = apiKey;
      } else if (provider === 'realtymole') {
        url = `https://realty-mole-property-api.p.rapidapi.com/saleListings?${queryParams.toString()}`;
        headers['X-RapidAPI-Key'] = apiKey;
        headers['X-RapidAPI-Host'] = 'realty-mole-property-api.p.rapidapi.com';
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        console.error(`Property API error: ${response.status} ${response.statusText}`);
        return this.fetchFromLocalListings(params, limit, offset);
      }

      const data = await response.json();
      return this.normalizeResults(data, provider);
    } catch (error) {
      console.error('SearchService fetchFromProvider error:', error);
      return this.fetchFromLocalListings(params, limit, offset);
    }
  },

  /**
   * Fallback: search extracted_listings table locally
   */
  async fetchFromLocalListings(params: SearchParams, limit: number, offset: number): Promise<SearchResult[]> {
    try {
      const conditions: string[] = [];
      const values: any[] = [];
      let paramIdx = 1;

      if (params.city) {
        conditions.push(`city ILIKE $${paramIdx}`);
        values.push(`%${params.city}%`);
        paramIdx++;
      }
      if (params.state) {
        conditions.push(`state ILIKE $${paramIdx}`);
        values.push(`%${params.state}%`);
        paramIdx++;
      }
      if (params.zip) {
        conditions.push(`zip = $${paramIdx}`);
        values.push(params.zip);
        paramIdx++;
      }
      if (params.minPrice) {
        conditions.push(`price >= $${paramIdx}`);
        values.push(params.minPrice);
        paramIdx++;
      }
      if (params.maxPrice) {
        conditions.push(`price <= $${paramIdx}`);
        values.push(params.maxPrice);
        paramIdx++;
      }
      if (params.propertyType) {
        conditions.push(`property_type ILIKE $${paramIdx}`);
        values.push(`%${params.propertyType}%`);
        paramIdx++;
      }
      if (params.listedWithin) {
        conditions.push(`created_at >= NOW() - INTERVAL '${Number(params.listedWithin)} days'`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      values.push(limit, offset);

      const listings = await DataService.findMany<ExtractedListingRecord>(
        `SELECT * FROM extracted_listings ${whereClause} ORDER BY created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
        values
      );

      return listings.map(l => ({
        id: l.id,
        address: l.address,
        city: l.city,
        state: l.state,
        zip: l.zip,
        price: Number(l.price),
        beds: l.beds,
        baths: l.baths ? Number(l.baths) : null,
        sqft: l.sqft,
        property_type: l.property_type,
        listing_status: l.listing_status,
        year_built: l.year_built,
        lot_size: l.lot_size ? Number(l.lot_size) : null,
        tax_amount: l.tax_amount ? Number(l.tax_amount) : null,
      }));
    } catch (error) {
      console.error('SearchService fetchFromLocalListings error:', error);
      throw error;
    }
  },

  /**
   * Normalize API response into SearchResult[]
   */
  normalizeResults(data: any, provider: string): SearchResult[] {
    try {
      let items: any[] = [];

      if (provider === 'rentcast') {
        items = Array.isArray(data) ? data : [];
      } else if (provider === 'attom') {
        items = data?.property || [];
      } else if (provider === 'realtymole') {
        items = Array.isArray(data) ? data : [];
      }

      return items.map((item: any, idx: number) => ({
        id: item.id || `ext-${idx}`,
        address: item.formattedAddress || item.addressLine1 || item.address || '',
        city: item.city || '',
        state: item.state || '',
        zip: item.zipCode || item.zip || '',
        price: Number(item.price || item.listPrice || item.salePrice || 0),
        beds: item.bedrooms || item.beds || null,
        baths: item.bathrooms || item.baths || null,
        sqft: item.squareFootage || item.sqft || item.livingArea || null,
        property_type: item.propertyType || null,
        listing_status: item.status || item.listingStatus || null,
        year_built: item.yearBuilt || null,
        lot_size: item.lotSize || null,
        tax_amount: item.taxAmount || item.propertyTaxes || null,
      }));
    } catch (error) {
      console.error('SearchService normalizeResults error:', error);
      return [];
    }
  },

  /**
   * Get listing by ID from extracted_listings
   */
  async getListingById(id: string): Promise<ExtractedListingRecord | null> {
    try {
      return await DataService.findOne<ExtractedListingRecord>(
        'SELECT * FROM extracted_listings WHERE id = $1',
        [id]
      );
    } catch (error) {
      console.error('SearchService getListingById error:', error);
      throw error;
    }
  },

  /**
   * Save a listing to extracted_listings
   */
  async saveListing(userId: string, data: Partial<ExtractedListingRecord>): Promise<ExtractedListingRecord> {
    try {
      return await DataService.insertOne<ExtractedListingRecord>('extracted_listings', {
        user_id: userId,
        source: data.source || 'manual',
        source_url: data.source_url || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zip: data.zip || '',
        price: data.price || 0,
        beds: data.beds || null,
        baths: data.baths || null,
        sqft: data.sqft || null,
        lot_size: data.lot_size || null,
        year_built: data.year_built || null,
        property_type: data.property_type || null,
        tax_amount: data.tax_amount || null,
        hoa: data.hoa || null,
        listing_status: data.listing_status || 'active',
        raw_data: data.raw_data || {},
      });
    } catch (error) {
      console.error('SearchService saveListing error:', error);
      throw error;
    }
  },

  /**
   * Get user's saved listings
   */
  async getUserListings(userId: string): Promise<ExtractedListingRecord[]> {
    try {
      return await DataService.findMany<ExtractedListingRecord>(
        'SELECT * FROM extracted_listings WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
    } catch (error) {
      console.error('SearchService getUserListings error:', error);
      throw error;
    }
  },

  /**
   * Save a search query for re-running later
   */
  async saveSearchQuery(userId: string, params: SearchParams): Promise<PropertySearchRecord> {
    try {
      const queryStr = [params.city, params.state, params.zip].filter(Boolean).join(', ');
      return await DataService.insertOne<PropertySearchRecord>('property_searches', {
        user_id: userId,
        query: queryStr,
        city: params.city || null,
        state: params.state || null,
        zip: params.zip || null,
        property_type: params.propertyType || null,
        min_price: params.minPrice || null,
        max_price: params.maxPrice || null,
        results_count: 0,
      });
    } catch (error) {
      console.error('SearchService saveSearchQuery error:', error);
      throw error;
    }
  },

  /**
   * Get user's saved searches
   */
  async getUserSearches(userId: string): Promise<PropertySearchRecord[]> {
    try {
      return await DataService.findMany<PropertySearchRecord>(
        'SELECT * FROM property_searches WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20',
        [userId]
      );
    } catch (error) {
      console.error('SearchService getUserSearches error:', error);
      throw error;
    }
  },
};

export default SearchService;

import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { SearchController } from '../controllers/search.controller';

// @governance-tracked — API definitions added: GET /search, GET /search/:id, POST /search/save-query, GET /search/my-searches, GET /search/redfin-city-id
const router: Router = Router();

// Redfin city-id lookup — proxies Redfin's public location-autocomplete so
// the client can produce /city/{cityId}/{state}/{slug}/filter/... URLs that
// survive Redfin's slug→canonical redirect (which drops /filter/ suffixes).
// Cached in-process for the server's lifetime.
const redfinCityIdCache = new Map<string, { cityId: string | null; at: number }>();
const REDFIN_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
router.get('/redfin-city-id', async (req: Request, res: Response) => {
  const city = String(req.query.city || '').trim();
  const state = String(req.query.state || '').trim();
  if (!city || !state) {
    return res.status(400).json({ error: 'city and state are required' });
  }
  const key = `${city.toLowerCase()}|${state.toUpperCase()}`;
  const cached = redfinCityIdCache.get(key);
  if (cached && Date.now() - cached.at < REDFIN_CACHE_TTL_MS) {
    return res.json({ cityId: cached.cityId, cached: true });
  }
  try {
    const location = encodeURIComponent(`${city} ${state}`);
    const url = `https://www.redfin.com/stingray/do/location-autocomplete?location=${location}&start=0&count=10&v=2`;
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 DealEval/1.0', Accept: 'application/json' },
    });
    const raw = await r.text();
    // Redfin prepends "{}&&" as an anti-hijacking guard.
    const json = JSON.parse(raw.replace(/^\{\}&&/, ''));
    const sections = json?.payload?.sections || [];
    let cityId: string | null = null;
    for (const section of sections) {
      for (const row of section.rows || []) {
        const url = String(row.url || '');
        const m = url.match(/^\/city\/(\d+)\/([A-Z]{2})\//);
        if (m && m[2].toUpperCase() === state.toUpperCase()) {
          const rowName = String(row.name || '').toLowerCase();
          if (rowName.includes(city.toLowerCase())) {
            cityId = m[1];
            break;
          }
        }
      }
      if (cityId) break;
    }
    redfinCityIdCache.set(key, { cityId, at: Date.now() });
    res.json({ cityId, cached: false });
  } catch (err) {
    res.status(502).json({ error: 'lookup_failed' });
  }
});

// Anonymous access - no auth required for searching
router.get('/', (req: Request, res: Response) => SearchController.search(req, res));
router.get('/my-searches', authMiddleware, (req: AuthRequest, res: Response) => SearchController.mySearches(req, res));
router.get('/:id', (req: Request, res: Response) => SearchController.getById(req, res));
router.post('/save-query', authMiddleware, (req: AuthRequest, res: Response) => SearchController.saveQuery(req, res));

export default router;

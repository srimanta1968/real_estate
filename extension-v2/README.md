# DealEval Pro — Remote-Config Extension (Phase 2)

A "thin shell" Chrome extension that scrapes real-estate listings using
a JSON configuration served from the DealEval server. Fixing a broken
selector or adding a new site means editing `server/config/scrape-config.json`
and redeploying the server — **no extension update, no Chrome Web Store review**.

## How it differs from the v1 extension

| Concern | v1 | v2 (this folder) |
|---|---|---|
| Selectors / regex | Hardcoded per site | From remote JSON config |
| Bot-challenge detectors | Hardcoded | From remote config |
| Adding a new listing site | New `*-search.js` + zip + Web Store review | Edit `scrape-config.json` + deploy server |
| Scraper per site | Separate files | One generic engine |
| Extension ID | `iefdcpemagecgjkabcpibhpbgabnfdgl` | New ID on first Web Store publish |

## Local testing against the dev server

1. **Start the DealEval server** (so `/api/extension-config/scrape-config` is reachable):
   ```
   cd server && npm run dev     # listens on :3000
   cd client && npm run dev     # listens on :5173
   ```
2. **Load the unpacked extension in Chrome**:
   - `chrome://extensions` → Enable **Developer mode** → **Load unpacked** → select this folder (`extension-v2`).
   - Copy the Extension ID shown on the card — you'll need it for v2 testing.
3. **Point the extension at your dev server**:
   - Click the DealEval Pro toolbar icon → the popup.
   - Click **Dev (localhost)** → **Save** → **Refresh config**. Status should show "OK — loaded config v1 with N sites".
4. **Run a Search on Sites from the DealEval UI** at `http://localhost:5173/search`. The extension will:
   - Open each target site tab.
   - Wait for the page to render.
   - Inject the generic scraper with the site's config entry.
   - Push results back to the DealEval tab via the bridge.

## Editing the scrape config

File: `server/config/scrape-config.json`

- **Adding a new site** — append a new entry to `sites`, give it a `match` pattern, a `listingCardSelector`, and a `fields` map.
- **Fixing a broken selector** — edit the corresponding `fields.<name>.selectors` or `regex`.
- **Adding a bot-challenge detector** — append to `botChallenge.detectors`.
- **Bumping the config version** — increment `version`. The extension logs the version on fetch.

After editing, restart/deploy the server. Extensions re-fetch the
config on popup "Refresh" or every 15 minutes automatically.

## Field extractor shapes

Each field in `fields.*` is one of:

- **Regex on card text**:
  ```json
  { "regex": "(\\d+)\\s*bd", "group": 1, "parse": "int" }
  ```
- **Fallback regex ladder**:
  ```json
  { "tryInOrder": [
      { "regex": "\\$(\\d{1,3}(?:,\\d{3})+)", "parse": "number_strip_commas" },
      { "regex": "\\$(\\d+(?:\\.\\d+)?)\\s*([MK])\\b", "group": 1, "multiplierGroup": 2, "parse": "abbreviated" }
    ], "min": 1000 }
  ```
- **CSS selector(s)**:
  ```json
  { "selectors": ["[data-cy='propertyPrice']", ".price"] }
  ```
- **Attribute extraction**:
  ```json
  { "selectors": ["a[href*='/Listing/']"], "attribute": "href", "absolute": true }
  ```
- **Card-level attribute (e.g. `data-*` on the tile)**:
  ```json
  { "attribute": "gtm-listing-id" }
  ```
- **Scoped regex (within a child element)**:
  ```json
  { "within": "[data-cy='propertyDescription']", "regex": "([\\d,]+)\\s*SqFt" }
  ```
- **Multi-part capture**:
  ```json
  { "regex": "([A-Za-z\\s]+),\\s*([A-Z]{2})\\s*(\\d{5})?", "parts": { "city": 1, "state": 2, "zip": 3 } }
  ```

Supported `parse` kinds: `int`, `float`, `number_strip_commas`, `abbreviated`, `abbreviated_or_comma`.

## What's NOT remote-configurable (Chrome policy)

- **`host_permissions`** in `manifest.json`. New listing-site domains
  require a manifest update and Web Store re-review. The initial v2
  submission pre-registers a broad list of likely sites to minimize
  future re-submissions.
- **Remote code loading.** Chrome Web Store forbids `eval()` / dynamic
  `import()` of hosted JavaScript. Config is strictly **data**
  (selectors, regex strings, field shapes). The engine interprets it.

## Open items before v2 Web Store submission

- [ ] Test against at least one listing-site search URL per category (residential + commercial).
- [ ] Compare coverage vs v1 for Zillow / Realtor / Redfin / LoopNet / Crexi.
- [ ] Screenshots for the store listing.
- [ ] Distinct store name (e.g. "DealEval Pro" or "DealEval Remote").
- [ ] Add a pinned `key` field to `manifest.json` after first unpacked load so the ID is stable.

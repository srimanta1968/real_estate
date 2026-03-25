# DealEval Chrome Extension

Property data extractor for NLS/MLS listing sites.

## Structure

```
extension/
  manifest.json          # Chrome extension manifest v3
  icons/                 # Extension icons (16, 48, 128px)
  src/
    popup/               # Extension popup UI (login, extract button)
    background/          # Service worker (message passing, API calls)
    content/             # Site-specific content scripts
      realtor.js         # Realtor.com parser
      zillow.js          # Zillow parser
      loopnet.js         # LoopNet parser
      crexi.js           # Crexi parser
      fallback.js        # Generic JSON-LD/meta tag extractor
    options/             # Settings page (API URL, preferences)
    utils/               # Shared utilities (auth, normalization)
```

## Supported Sites

| Site | Type | Status |
|------|------|--------|
| Realtor.com | Residential | Planned |
| Zillow | Residential | Planned |
| LoopNet | Commercial | Planned |
| Crexi | Commercial | Planned |
| Redfin | Residential | Planned |
| Generic (JSON-LD) | Any | Planned |

## Development

1. Open `chrome://extensions/` in Chrome
2. Enable "Developer mode"
3. Click "Load unpacked" and select this `extension/` folder
4. Navigate to a supported listing page
5. Click the DealEval extension icon to extract data

## Auth

Login required. JWT token synced from DealEval web app via `chrome.storage.local`.

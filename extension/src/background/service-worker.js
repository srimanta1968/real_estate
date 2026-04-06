const SUPPORTED_PATTERNS = [
  '*://www.realtor.com/realestateandhomes-detail/*',
  '*://www.zillow.com/homedetails/*',
  '*://www.loopnet.com/Listing/*',
  '*://www.crexi.com/properties/*',
  '*://www.redfin.com/*',
];

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({ text: '' });
});

// ===== External Message Listener (receives auth token from web app) =====
// Web app sends token via chrome.runtime.sendMessage(EXTENSION_ID, { action: 'setAuthToken', ... })
// This eliminates the need for separate login in the extension popup
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  if (request.action === 'setAuthToken') {
    chrome.storage.local.set({
      token: request.token,
      apiUrl: request.apiBase || 'http://localhost:3000',
      userEmail: request.email || '',
    }, () => {
      console.log('DealEval BG: Auth token received from web app');
      sendResponse({ success: true });
    });
    return true; // keep channel open for async sendResponse
  }

  if (request.action === 'clearAuthToken') {
    chrome.storage.local.remove(['token', 'apiUrl', 'userEmail'], () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.action === 'getAuthStatus') {
    chrome.storage.local.get(['token', 'userEmail'], (data) => {
      sendResponse({ authenticated: !!data.token, email: data.userEmail || '' });
    });
    return true;
  }
});

// Helper to get auth config from storage
async function getAuthConfig() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['token', 'apiUrl'], (data) => {
      resolve({
        token: data.token || null,
        apiUrl: data.apiUrl || 'http://localhost:3000',
      });
    });
  });
}

// Search results page patterns — auto-scrape when these load
const SEARCH_PAGE_PATTERNS = [
  { pattern: /loopnet\.com\/search\//i, hostname: 'loopnet.com' },
  { pattern: /crexi\.com\/properties/i, hostname: 'crexi.com' },
  { pattern: /zillow\.com\/homes\//i, hostname: 'zillow.com' },
  { pattern: /realtor\.com\/realestateandhomes-search\//i, hostname: 'realtor.com' },
];

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url) return;

  const isSupported = SUPPORTED_PATTERNS.some(pattern => {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(tab.url);
  });
  if (isSupported) {
    chrome.action.setIcon({ tabId, path: { 16: '/icons/icon16.png', 48: '/icons/icon48.png' } }).catch(() => {});
  }

  // Auto-scrape search results pages when they finish loading
  const searchMatch = SEARCH_PAGE_PATTERNS.find(p => p.pattern.test(tab.url));
  if (searchMatch) {
    console.log('DealEval BG: Search page loaded, will auto-scrape:', tab.url);
    // Wait longer for SPA content (especially LoopNet Angular) to render prices
    setTimeout(() => {
      scrapeTab(tabId, searchMatch.hostname).then(results => {
        // Only store/forward if at least some results have prices
        const withPrices = results.filter(r => r.price > 0);
        if (withPrices.length === 0) {
          console.log(`DealEval BG: Auto-scraped ${results.length} listings but none have prices, skipping`);
          return;
        }
        console.log(`DealEval BG: Auto-scraped ${results.length} listings (${withPrices.length} with prices) from ${searchMatch.hostname}`);
        mergeAndForwardResults(results, searchMatch.hostname);
      });
    }, 12000); // 12s delay — LoopNet Angular needs time to render prices
  }
});

// ===== Scraper functions (injected into tabs via executeScript) =====

function scrapeLoopNet() {
  const listings = [];
  const articles = document.querySelectorAll('article.placard');
  articles.forEach((article) => {
    try {
      const listingId = article.getAttribute('gtm-listing-id') || article.getAttribute('data-id');
      if (!listingId) return;
      const listing = { id: 'loopnet-' + listingId, source: 'loopnet.com', property_type: 'Commercial' };
      // GTM attributes for location and type
      listing.city = article.getAttribute('gtm-listing-city') || '';
      listing.state = article.getAttribute('gtm-listing-state') || '';
      listing.zip = article.getAttribute('gtm-listing-zip') || '';
      const gtmType = article.getAttribute('gtm-listing-property-type-name');
      if (gtmType) listing.property_type = gtmType;
      // Source URL
      const firstLink = article.querySelector('a[href*="/Listing/"]');
      listing.source_url = firstLink ? firstLink.href : '';
      // Address from h4 links (tier1: a.left-h4, tier4: h4 a)
      const addrEl = article.querySelector('a.left-h4, h4 a');
      if (addrEl) listing.address = addrEl.textContent.trim();
      if (!listing.address || listing.address.length < 3) return;
      // Extract price, sqft, cap rate, year built from ALL li inside .placard-info
      const dataLis = article.querySelectorAll('.placard-info li');
      for (const li of dataLis) {
        const t = li.textContent.trim();
        if (!listing.price && t.includes('$')) {
          const pm = t.match(/\$\s*([\d,]+(?:\.\d+)?)\s*(M|K)?/);
          if (pm) {
            let price = parseFloat(pm[1].replace(/,/g, ''));
            if (pm[2] === 'M') price *= 1000000;
            else if (pm[2] === 'K') price *= 1000;
            if (price > 0 && price < 10000000000) listing.price = price;
          }
        }
        const sm = t.match(/([\d,]+)\s*SF\b/i);
        if (sm && !listing.sqft) listing.sqft = parseInt(sm[1].replace(/,/g, ''));
        const cm = t.match(/([\d.]+)\s*%\s*Cap/i);
        if (cm) listing.cap_rate = parseFloat(cm[1]);
        const ym = t.match(/Built\s+in\s+(\d{4})/i);
        if (ym) listing.year_built = parseInt(ym[1]);
      }
      // Fallback: parse whole placard-info text for price
      if (!listing.price) {
        const infoEl = article.querySelector('.placard-info');
        if (infoEl) {
          const pm = infoEl.textContent.match(/\$\s*([\d,]+(?:\.\d+)?)\s*(M|K)?/);
          if (pm) {
            let price = parseFloat(pm[1].replace(/,/g, ''));
            if (pm[2] === 'M') price *= 1000000;
            else if (pm[2] === 'K') price *= 1000;
            if (price > 0 && price < 10000000000) listing.price = price;
          }
        }
      }
      listings.push(listing);
    } catch (e) {}
  });
  return listings;
}

function scrapeCrexi() {
  const listings = [];
  const tiles = document.querySelectorAll('crx-sales-property-tile');
  tiles.forEach((tile, idx) => {
    try {
      const listing = { id: 'crexi-' + idx + '-' + Date.now(), source: 'crexi.com', property_type: 'Commercial' };
      const priceEl = tile.querySelector('[data-cy="propertyPrice"]');
      if (priceEl) {
        const priceText = priceEl.textContent || '';
        const pm = priceText.match(/\$?\s*([\d,]+(?:\.\d+)?)\s*(M|K)?/i);
        if (pm) {
          let p = parseFloat(pm[1].replace(/,/g, ''));
          if (pm[2] && pm[2].toUpperCase() === 'M') p *= 1000000;
          else if (pm[2] && pm[2].toUpperCase() === 'K') p *= 1000;
          if (p > 1000 && p < 5000000000) listing.price = p;
        }
      }
      const nameEl = tile.querySelector('[data-cy="propertyName"]');
      if (nameEl) listing.address = nameEl.textContent.trim();
      const addrEl = tile.querySelector('[data-cy="propertyAddress"]');
      if (addrEl) {
        const smallSpan = addrEl.querySelector('.cui-card-info-text-small');
        if (smallSpan) {
          const locMatch = smallSpan.textContent.trim().match(/([A-Za-z\s]+),\s*([A-Z]{2})\s*(\d{5})?/);
          if (locMatch) { listing.city = locMatch[1].trim(); listing.state = locMatch[2]; if (locMatch[3]) listing.zip = locMatch[3]; }
        }
        if (!listing.address) listing.address = addrEl.textContent.trim().replace(/\s+/g, ' ');
      }
      const descEl = tile.querySelector('[data-cy="propertyDescription"]');
      if (descEl) {
        const desc = descEl.textContent.trim();
        const sqftMatch = desc.match(/([\d,]+)\s*(?:SqFt|SF)/i);
        if (sqftMatch) listing.sqft = parseInt(sqftMatch[1].replace(/,/g, ''));
        const typeMatch = desc.match(/^([^•]+)/);
        if (typeMatch && typeMatch[1].trim().length < 50) listing.property_type = typeMatch[1].trim();
      }
      const linkEl = tile.querySelector('a.cui-card-cover-link, a[href*="/properties/"]');
      if (linkEl) {
        const href = linkEl.getAttribute('href') || '';
        listing.source_url = href.startsWith('http') ? href : 'https://www.crexi.com' + href;
      }
      if (listing.address && listing.address.length > 3) listings.push(listing);
    } catch (e) {}
  });
  return listings;
}

function scrapeGeneric() {
  const listings = [];
  const seenUrls = new Set();
  const seenAddrs = new Set();
  const hostname = window.location.hostname;
  const linkPatterns = [];
  if (hostname.includes('zillow')) linkPatterns.push('/homedetails/');
  else if (hostname.includes('realtor')) linkPatterns.push('/realestateandhomes-detail/');
  else if (hostname.includes('redfin')) linkPatterns.push('/home/');
  else linkPatterns.push('/homedetails/', '/realestateandhomes-detail/', '/Listing/', '/properties/');
  const allLinks = document.querySelectorAll('a[href]');
  const propLinks = [];
  for (const link of allLinks) {
    const href = link.href || '';
    if (linkPatterns.some(p => href.includes(p)) && !seenUrls.has(href)) { seenUrls.add(href); propLinks.push(link); }
  }
  propLinks.forEach((link, idx) => {
    try {
      let container = link.parentElement;
      for (let i = 0; i < 5 && container; i++) {
        if (container.textContent.length > 50 && container.textContent.length < 1500 && (container.textContent.includes('$') || /\d+\s*(?:SF|sqft|bd|ba)/i.test(container.textContent))) break;
        if (container.parentElement && container.parentElement.textContent.length < 1500) container = container.parentElement; else break;
      }
      if (!container || container.textContent.length > 1500) return;
      const text = container.textContent;
      const listing = { id: 'generic-' + idx + '-' + Date.now(), source: hostname, source_url: link.href, property_type: 'Residential' };
      const addrEls = container.querySelectorAll('address, h2, h3, [class*="address" i]');
      for (const el of addrEls) { const t = el.textContent.trim(); if (t.length > 5 && t.length < 150 && !t.includes('$')) { listing.address = t; break; } }
      if (!listing.address) { const lt = link.textContent.trim(); if (lt.length > 5 && lt.length < 150) listing.address = lt; }
      if (!listing.address) return;
      const ak = listing.address.toLowerCase(); if (seenAddrs.has(ak)) return; seenAddrs.add(ak);
      const pm = text.match(/\$(\d{1,3}(?:,\d{3})*)/); if (pm) { const p = parseFloat(pm[1].replace(/,/g, '')); if (p > 1000 && p < 5e9) listing.price = p; }
      const sm = text.match(/([\d,]+)\s*(?:sqft|sq\s*ft|SF)/i); if (sm) listing.sqft = parseInt(sm[1].replace(/,/g, ''));
      const bm = text.match(/(\d+)\s*(?:bd|bed)/i); if (bm) listing.beds = parseInt(bm[1]);
      const btm = text.match(/(\d+\.?\d*)\s*(?:ba|bath)/i); if (btm) listing.baths = parseFloat(btm[1]);
      const lm = text.match(/([A-Z][a-zA-Z\s]+?),\s*([A-Z]{2})(?:\s+(\d{5}))?/); if (lm) { listing.city = lm[1].trim(); listing.state = lm[2]; if (lm[3]) listing.zip = lm[3]; }
      listings.push(listing);
    } catch (e) {}
  });
  return listings;
}

// ===== Merge helper — replaces incomplete entries with more complete ones =====

function mergeAndForwardResults(results, source) {
  chrome.storage.local.get(['siteSearchResults'], (stored) => {
    const existing = stored.siteSearchResults || [];
    // Index existing by address for fast lookup
    const byAddr = new Map();
    existing.forEach((r, i) => {
      if (r.address) byAddr.set(r.address.toLowerCase().trim(), i);
    });

    const merged = [...existing];
    for (const r of results) {
      const key = (r.address || '').toLowerCase().trim();
      if (!key || key.length < 4) continue;
      if (/commercial real estate|for sale|properties for|auctions/i.test(key)) continue;

      const existingIdx = byAddr.get(key);
      if (existingIdx !== undefined) {
        // Replace if new entry has price and old one doesn't
        if (r.price > 0 && !(merged[existingIdx].price > 0)) {
          merged[existingIdx] = r;
        }
      } else {
        byAddr.set(key, merged.length);
        merged.push(r);
      }
    }

    chrome.storage.local.set({ siteSearchResults: merged });
    chrome.action.setBadgeText({ text: String(merged.length) });
    chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
    // Forward to DealEval tabs
    chrome.tabs.query({ url: 'http://localhost:*/*' }, (tabs) => {
      for (const t of tabs) {
        chrome.tabs.sendMessage(t.id, { type: 'SITE_SEARCH_RESULTS', data: merged, source }).catch(() => {});
      }
    });
  });
}

// ===== Page status detection (CAPTCHA, 404, challenge pages) =====

function detectPageStatus() {
  const title = (document.title || '').toLowerCase();
  // Only check a small portion of text from the visible page body (skip scripts/styles)
  const mainEl = document.querySelector('main, #content, #main, [role="main"]') || document.body;
  const bodyText = (mainEl?.textContent || '').substring(0, 2000).toLowerCase();

  // 404 / not found — only flag if the TITLE indicates an error page
  // (normal pages may mention "not found" in body text for zero-results)
  if ((title.includes('not found') || title.includes('404') || title.includes('page not found')) &&
      (bodyText.includes('page not found') || bodyText.includes("can't find what you're looking for") ||
       bodyText.includes('this page is no longer available') || bodyText.includes('return to homepage'))) {
    return { blocked: true, reason: '404_not_found', message: 'Page not found (404)' };
  }

  // CAPTCHA / robot challenge — require strong signals, not generic words.
  // "press and hold" alone is NOT a CAPTCHA (maps use this for zoom).
  // Look for dedicated CAPTCHA page indicators.
  const hasCaptchaFrame = !!document.querySelector(
    'iframe[src*="recaptcha"], iframe[src*="hcaptcha"], iframe[src*="arkoselabs"], iframe[src*="funcaptcha"]'
  );
  const isCaptchaPage = (
    (title.includes('captcha') || title.includes('are you a robot') || title.includes('bot verification')) ||
    (bodyText.includes('are you a robot') && bodyText.includes('verify')) ||
    (bodyText.includes('verify you are human') && bodyText.length < 500) ||
    (bodyText.includes('complete the security check') && bodyText.length < 500) ||
    (bodyText.includes('press and hold') && bodyText.includes('verify') && bodyText.length < 500)
  );
  if (isCaptchaPage || (hasCaptchaFrame && bodyText.length < 1000)) {
    return { blocked: true, reason: 'captcha', message: 'CAPTCHA or robot challenge detected' };
  }

  // Access denied / Cloudflare challenge — require the page to be mostly empty
  // (a real Cloudflare interstitial has very little content)
  const isCfChallenge = !!document.querySelector('#challenge-running, #challenge-form, .cf-browser-verification');
  if (isCfChallenge ||
      (title === 'just a moment...' || title === 'attention required! | cloudflare') ||
      (title.includes('access denied') && bodyText.length < 500)) {
    return { blocked: true, reason: 'access_denied', message: 'Access blocked by site protection' };
  }

  // Rate limited
  if ((title.includes('too many requests') || title.includes('429')) &&
      (bodyText.includes('rate limit') || bodyText.includes('too many requests'))) {
    return { blocked: true, reason: 'rate_limited', message: 'Rate limited — too many requests' };
  }

  return { blocked: false };
}

// ===== Scraping orchestration (runs in background, survives popup close) =====

async function checkPageStatus(tabId) {
  try {
    const results = await chrome.scripting.executeScript({ target: { tabId }, func: detectPageStatus });
    return results[0]?.result || { blocked: false };
  } catch {
    return { blocked: false };
  }
}

async function scrapeTab(tabId, hostname) {
  const scraperFunc = hostname.includes('loopnet') ? scrapeLoopNet
    : hostname.includes('crexi') ? scrapeCrexi
    : scrapeGeneric;
  try {
    const results = await chrome.scripting.executeScript({ target: { tabId }, func: scraperFunc });
    return results[0]?.result || [];
  } catch (err) {
    console.error('DealEval BG: scrape failed for tab', tabId, err);
    return [];
  }
}

async function notifyDealEvalTabs(message) {
  const dealEvalTabs = await chrome.tabs.query({ url: 'http://localhost:*/*' });
  for (const tab of dealEvalTabs) {
    chrome.tabs.sendMessage(tab.id, message).catch(() => {});
  }
}

async function runSiteSearch(tabInfos) {
  console.log('DealEval BG: Starting scrape of', tabInfos.length, 'tabs');
  chrome.action.setBadgeText({ text: '...' });
  chrome.action.setBadgeBackgroundColor({ color: '#f59e0b' });

  // Wait for pages to load — LoopNet's Angular app needs extra time to render prices
  // Try at 10s, then 18s
  for (const delay of [10000, 18000]) {
    await new Promise(r => setTimeout(r, delay === 10000 ? 10000 : 8000));

    const allResults = [];
    const blockedSites = [];

    for (const { tabId, hostname } of tabInfos) {
      // Check for CAPTCHA / error pages before scraping
      const status = await checkPageStatus(tabId);
      if (status.blocked) {
        console.warn(`DealEval BG: ${hostname} blocked — ${status.reason}: ${status.message}`);
        blockedSites.push({ hostname, ...status });

        // If CAPTCHA, bring the tab to foreground so user can solve it
        if (status.reason === 'captcha') {
          chrome.tabs.update(tabId, { active: true }).catch(() => {});
        }
        continue;
      }

      const data = await scrapeTab(tabId, hostname);
      console.log(`DealEval BG: Tab ${tabId} (${hostname}) returned ${data.length} listings`);
      allResults.push(...data);
    }

    // Notify about blocked sites
    if (blockedSites.length > 0) {
      await notifyDealEvalTabs({
        type: 'SITE_SEARCH_BLOCKED',
        data: blockedSites,
      });
    }

    // Dedup by address
    const seen = new Set();
    const unique = [];
    for (const r of allResults) {
      const key = (r.address || '').toLowerCase().trim();
      if (!key || key.length < 4 || seen.has(key)) continue;
      if (/commercial real estate|for sale|properties for|auctions/i.test(key)) continue;
      seen.add(key);
      unique.push(r);
    }

    if (unique.length > 0) {
      const withPrices = unique.filter(r => r.price > 0).length;
      console.log(`DealEval BG: Found ${unique.length} unique listings (${withPrices} with prices)`);

      // If we have listings but none have prices, keep retrying (Angular not rendered yet)
      if (withPrices === 0 && delay === 10000) {
        console.log('DealEval BG: No prices found yet, will retry after more time...');
        continue;
      }

      await chrome.storage.local.set({ siteSearchResults: unique });
      chrome.action.setBadgeText({ text: String(unique.length) });
      chrome.action.setBadgeBackgroundColor({ color: '#10b981' });

      await notifyDealEvalTabs({ type: 'SITE_SEARCH_RESULTS', data: unique, source: 'multi-site' });
      return; // Success, stop retrying
    }

    // If all sites are blocked (not just empty), don't retry — it won't help
    if (blockedSites.length === tabInfos.length) {
      console.log('DealEval BG: All sites blocked, stopping retries');
      break;
    }

    console.log('DealEval BG: No results yet, will retry...');
  }

  // Both attempts failed
  console.log('DealEval BG: No listings found after retries');
  chrome.action.setBadgeText({ text: '0' });
  chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
}

// ===== Message handlers =====

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EXTRACTION_COMPLETE') {
    chrome.storage.local.set({ lastExtracted: message.data });
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#4f46e5' });
    chrome.notifications.create({ type: 'basic', iconUrl: '/icons/icon128.png', title: 'Property Extracted', message: (message.data.address || 'Property') + ' data ready to send to DealEval' }).catch(() => {});
    sendResponse({ success: true });
  }

  if (message.type === 'GET_AUTH') {
    chrome.storage.local.get(['token']).then(result => { sendResponse({ token: result.token || null }); });
    return true;
  }

  if (message.type === 'CLEAR_SITE_RESULTS') {
    chrome.storage.local.remove(['siteSearchResults']);
    chrome.action.setBadgeText({ text: '' });
    sendResponse({ success: true });
    return;
  }

  // Popup tells us to open tabs and scrape them
  if (message.type === 'START_SITE_SEARCH') {
    const urls = message.urls || []; // [{url, hostname}]
    console.log('DealEval BG: START_SITE_SEARCH with', urls.length, 'sites');

    // Clear old results
    chrome.storage.local.remove(['siteSearchResults']);
    chrome.action.setBadgeText({ text: '...' });
    chrome.action.setBadgeBackgroundColor({ color: '#f59e0b' });

    // Open tabs and start scraping
    (async () => {
      const tabInfos = [];
      for (const u of urls) {
        const tab = await chrome.tabs.create({ url: u.url, active: false });
        tabInfos.push({ tabId: tab.id, hostname: u.hostname });
      }
      await runSiteSearch(tabInfos);
    })();

    sendResponse({ success: true });
    return true;
  }

  // Also handle results from content scripts (if they work)
  if (message.type === 'SEARCH_RESULTS_SCRAPED') {
    const newResults = message.data || [];
    const source = message.source || 'unknown';
    console.log('DealEval BG: Received', newResults.length, 'results from', source, '(' + newResults.filter(r => r.price > 0).length + ' with prices)');
    // Use smart merge that replaces incomplete entries
    mergeAndForwardResults(newResults, source);
    sendResponse({ success: true });
    return true;
  }
});

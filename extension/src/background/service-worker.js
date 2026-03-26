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
    // Wait for SPA content to render, then scrape
    setTimeout(() => {
      scrapeTab(tabId, searchMatch.hostname).then(results => {
        if (results.length > 0) {
          console.log(`DealEval BG: Auto-scraped ${results.length} listings from ${searchMatch.hostname}`);
          // Store and forward
          chrome.storage.local.get(['siteSearchResults'], (stored) => {
            const existing = stored.siteSearchResults || [];
            const seen = new Set();
            existing.forEach(r => { if (r.address) seen.add(r.address.toLowerCase()); });
            const merged = [...existing];
            for (const r of results) {
              const key = (r.address || '').toLowerCase().trim();
              if (!key || key.length < 4 || seen.has(key)) continue;
              if (/commercial real estate|for sale|properties for|auctions/i.test(key)) continue;
              seen.add(key);
              merged.push(r);
            }
            chrome.storage.local.set({ siteSearchResults: merged });
            chrome.action.setBadgeText({ text: String(merged.length) });
            chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
            // Forward to DealEval tabs
            chrome.tabs.query({ url: 'http://localhost:*/*' }, (tabs) => {
              for (const t of tabs) {
                chrome.tabs.sendMessage(t.id, { type: 'SITE_SEARCH_RESULTS', data: merged, source: searchMatch.hostname }).catch(() => {});
              }
            });
          });
        }
      });
    }, 5000); // 5s delay for SPA rendering
  }
});

// ===== Scraper functions (injected into tabs via executeScript) =====

function scrapeLoopNet() {
  const listings = [];
  const articles = document.querySelectorAll('article.placard');
  articles.forEach((article, idx) => {
    try {
      const listing = { id: 'loopnet-' + idx + '-' + Date.now(), source: 'loopnet.com', property_type: 'Commercial' };
      listing.city = article.getAttribute('gtm-listing-city') || '';
      listing.state = article.getAttribute('gtm-listing-state') || '';
      listing.zip = article.getAttribute('gtm-listing-zip') || '';
      const gtmType = article.getAttribute('gtm-listing-property-type-name');
      if (gtmType) listing.property_type = gtmType;
      const firstLink = article.querySelector('a[href*="/Listing/"]');
      listing.source_url = firstLink ? firstLink.href : '';
      const addrEl = article.querySelector('.header-left h4 a, a.left-h4');
      if (addrEl) listing.address = addrEl.textContent.trim();
      const nameEl = article.querySelector('.header-left h6 a, a.left-h6');
      const propName = nameEl ? nameEl.textContent.trim() : '';
      if (!listing.address && propName) listing.address = propName;
      if (listing.address && propName && propName !== listing.address) listing.address = listing.address + ' - ' + propName;
      const sizeEl = article.querySelector('.header-right h4 a, a.right-h4');
      if (sizeEl) {
        const sqftMatch = sizeEl.textContent.match(/([\d,]+)\s*SF/i);
        if (sqftMatch) listing.sqft = parseInt(sqftMatch[1].replace(/,/g, ''));
      }
      const locEl = article.querySelector('.header-right h6 a, a.right-h6');
      if (locEl && !listing.city) {
        const locMatch = locEl.textContent.match(/([A-Za-z\s]+),\s*([A-Z]{2})\s*(\d{5})?/);
        if (locMatch) { listing.city = locMatch[1].trim(); listing.state = locMatch[2]; if (locMatch[3]) listing.zip = locMatch[3]; }
      }
      const infoText = (article.querySelector('.placard-info') || {}).textContent || '';
      const priceMatch = infoText.match(/\$\s*([\d,]+(?:\.\d+)?)\s*(M|K)?/);
      if (priceMatch) {
        let price = parseFloat(priceMatch[1].replace(/,/g, ''));
        if (priceMatch[2] === 'M') price *= 1000000;
        else if (priceMatch[2] === 'K') price *= 1000;
        if (price > 1000 && price < 5000000000) listing.price = price;
      }
      if (listing.address && listing.address.length > 3) listings.push(listing);
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
        const p = parseFloat(priceEl.textContent.replace(/[^0-9.]/g, ''));
        if (p > 1000 && p < 5000000000) listing.price = p;
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
      const pm = text.match(/\$([\d,]+)/); if (pm) { const p = parseFloat(pm[1].replace(/,/g, '')); if (p > 1000 && p < 5e9) listing.price = p; }
      const sm = text.match(/([\d,]+)\s*(?:sqft|sq\s*ft|SF)/i); if (sm) listing.sqft = parseInt(sm[1].replace(/,/g, ''));
      const bm = text.match(/(\d+)\s*(?:bd|bed)/i); if (bm) listing.beds = parseInt(bm[1]);
      const btm = text.match(/(\d+\.?\d*)\s*(?:ba|bath)/i); if (btm) listing.baths = parseFloat(btm[1]);
      const lm = text.match(/([A-Z][a-zA-Z\s]+?),\s*([A-Z]{2})(?:\s+(\d{5}))?/); if (lm) { listing.city = lm[1].trim(); listing.state = lm[2]; if (lm[3]) listing.zip = lm[3]; }
      listings.push(listing);
    } catch (e) {}
  });
  return listings;
}

// ===== Scraping orchestration (runs in background, survives popup close) =====

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

async function runSiteSearch(tabInfos) {
  console.log('DealEval BG: Starting scrape of', tabInfos.length, 'tabs');
  chrome.action.setBadgeText({ text: '...' });
  chrome.action.setBadgeBackgroundColor({ color: '#f59e0b' });

  // Wait for pages to load (try at 8s, then 14s)
  for (const delay of [8000, 14000]) {
    await new Promise(r => setTimeout(r, delay === 8000 ? 8000 : 6000));

    const allResults = [];
    for (const { tabId, hostname } of tabInfos) {
      const data = await scrapeTab(tabId, hostname);
      console.log(`DealEval BG: Tab ${tabId} (${hostname}) returned ${data.length} listings`);
      allResults.push(...data);
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
      console.log(`DealEval BG: Found ${unique.length} unique listings`);
      await chrome.storage.local.set({ siteSearchResults: unique });
      chrome.action.setBadgeText({ text: String(unique.length) });
      chrome.action.setBadgeBackgroundColor({ color: '#10b981' });

      // Forward to DealEval tabs
      const dealEvalTabs = await chrome.tabs.query({ url: 'http://localhost:*/*' });
      for (const tab of dealEvalTabs) {
        chrome.tabs.sendMessage(tab.id, { type: 'SITE_SEARCH_RESULTS', data: unique, source: 'multi-site' }).catch(() => {});
      }
      return; // Success, stop retrying
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
    console.log('DealEval BG: Received', newResults.length, 'results from', source);

    chrome.storage.local.get(['siteSearchResults'], (stored) => {
      const existing = stored.siteSearchResults || [];
      const seen = new Set();
      existing.forEach(r => { if (r.source_url) seen.add(r.source_url); if (r.address) seen.add(r.address); });
      const merged = [...existing];
      for (const r of newResults) {
        if (r.source_url && seen.has(r.source_url)) continue;
        if (r.address && seen.has(r.address)) continue;
        if (r.source_url) seen.add(r.source_url);
        if (r.address) seen.add(r.address);
        merged.push(r);
      }
      chrome.storage.local.set({ siteSearchResults: merged });
      chrome.action.setBadgeText({ text: String(merged.length) });
      chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
      chrome.tabs.query({ url: 'http://localhost:*/*' }, (tabs) => {
        for (const tab of tabs) {
          chrome.tabs.sendMessage(tab.id, { type: 'SITE_SEARCH_RESULTS', data: merged, source }).catch(() => {});
        }
      });
    });
    sendResponse({ success: true });
    return true;
  }
});

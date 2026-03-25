const SUPPORTED_SITES = [
  'realtor.com',
  'zillow.com',
  'loopnet.com',
  'crexi.com',
  'redfin.com',
];

let apiUrl = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async () => {
  const settings = await chrome.storage.sync.get(['apiUrl']);
  if (settings.apiUrl) apiUrl = settings.apiUrl;

  document.getElementById('dashboard-link').href = `${apiUrl.replace(':3000', ':5173')}/dashboard`;

  const { token } = await chrome.storage.local.get(['token']);

  if (token) {
    showMainSection();
    checkCurrentSite();
  } else {
    showAuthSection();
  }

  document.getElementById('login-btn').addEventListener('click', handleLogin);
  document.getElementById('extract-btn').addEventListener('click', handleExtract);
  document.getElementById('send-btn').addEventListener('click', handleSend);
  document.getElementById('logout-btn').addEventListener('click', handleLogout);

  // Tab switching
  document.getElementById('tab-extract').addEventListener('click', () => switchTab('extract'));
  document.getElementById('tab-search').addEventListener('click', () => switchTab('search'));

  // Search mode: update site checkboxes when type changes
  document.getElementById('search-type').addEventListener('change', updateSiteCheckboxes);
  document.getElementById('open-sites-btn').addEventListener('click', handleOpenSites);

  // Initialize site checkboxes
  updateSiteCheckboxes();
});

function showAuthSection() {
  document.getElementById('auth-section').style.display = 'block';
  document.getElementById('main-section').style.display = 'none';
  document.getElementById('unsupported-section').style.display = 'none';
}

function showMainSection() {
  document.getElementById('auth-section').style.display = 'none';
  document.getElementById('main-section').style.display = 'block';
  document.getElementById('unsupported-section').style.display = 'none';
}

function showUnsupported() {
  document.getElementById('auth-section').style.display = 'none';
  document.getElementById('main-section').style.display = 'none';
  document.getElementById('unsupported-section').style.display = 'block';
}

async function checkCurrentSite() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return;

  const url = new URL(tab.url);
  const isSupported = SUPPORTED_SITES.some(site => url.hostname.includes(site));

  if (!isSupported) {
    showMainSection();
    document.getElementById('extract-btn').disabled = true;
    document.getElementById('status-text').textContent = 'Site not auto-supported — use fallback';
  }
}

async function handleLogin() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const btn = document.getElementById('login-btn');

  if (!email || !password) return;

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';

  try {
    const res = await fetch(`${apiUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (data.success && data.data.token) {
      await chrome.storage.local.set({ token: data.data.token, userEmail: email });
      showMainSection();
      checkCurrentSite();
    } else {
      alert(data.error || 'Login failed');
    }
  } catch (err) {
    alert('Connection failed. Is DealEval running?');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sign In';
  }
}

async function handleExtract() {
  const btn = document.getElementById('extract-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Extracting...';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractFromPage,
    });

    const data = results[0]?.result;

    if (data && data.address) {
      showExtractedData(data);
      document.getElementById('status-text').textContent = 'Data extracted successfully';

      await chrome.storage.local.set({ lastExtracted: data });
    } else {
      document.getElementById('status-text').textContent = 'Could not extract — try fallback';
    }
  } catch (err) {
    document.getElementById('status-text').textContent = 'Extraction failed';
    console.error('Extract error:', err);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Extract This Property';
  }
}

function extractFromPage() {
  const data = {};

  // Try JSON-LD first
  const jsonLd = document.querySelector('script[type="application/ld+json"]');
  if (jsonLd) {
    try {
      const parsed = JSON.parse(jsonLd.textContent);
      const item = Array.isArray(parsed) ? parsed.find(p => p['@type'] === 'SingleFamilyResidence' || p['@type'] === 'Product' || p['@type'] === 'RealEstateListing') : parsed;
      if (item) {
        data.address = item.address?.streetAddress || item.name || '';
        data.city = item.address?.addressLocality || '';
        data.state = item.address?.addressRegion || '';
        data.zip = item.address?.postalCode || '';
        if (item.offers?.price) data.price = parseFloat(item.offers.price);
      }
    } catch {}
  }

  // Try Open Graph meta tags
  const ogTitle = document.querySelector('meta[property="og:title"]')?.content;
  const ogDesc = document.querySelector('meta[property="og:description"]')?.content;
  if (ogTitle && !data.address) data.address = ogTitle;

  // Try common patterns in page text
  const priceEl = document.querySelector('[data-testid="price"], .price, .listing-price, .hdp__sc-1s3rh9z-2');
  if (priceEl) {
    const priceText = priceEl.textContent.replace(/[^0-9.]/g, '');
    if (priceText) data.price = parseFloat(priceText);
  }

  const addressEl = document.querySelector('[data-testid="address"], .address, .listing-address, h1');
  if (addressEl && !data.address) data.address = addressEl.textContent.trim();

  // Beds/baths/sqft from common patterns
  const pageText = document.body.innerText;
  const bedsMatch = pageText.match(/(\d+)\s*(?:bed|br|bedroom)/i);
  const bathsMatch = pageText.match(/(\d+\.?\d*)\s*(?:bath|ba|bathroom)/i);
  const sqftMatch = pageText.match(/([\d,]+)\s*(?:sq\s*ft|sqft|square\s*feet)/i);
  const yearMatch = pageText.match(/(?:built|year\s*built|constructed)\s*(?:in\s*)?(\d{4})/i);

  if (bedsMatch) data.beds = parseInt(bedsMatch[1]);
  if (bathsMatch) data.baths = parseFloat(bathsMatch[1]);
  if (sqftMatch) data.sqft = parseInt(sqftMatch[1].replace(/,/g, ''));
  if (yearMatch) data.year_built = parseInt(yearMatch[1]);

  data.source = window.location.hostname;
  data.source_url = window.location.href;

  return data;
}

function showExtractedData(data) {
  const container = document.getElementById('extracted-fields');
  const fields = [
    ['Address', data.address],
    ['City', data.city],
    ['State', data.state],
    ['Zip', data.zip],
    ['Price', data.price ? `$${Number(data.price).toLocaleString()}` : ''],
    ['Beds', data.beds],
    ['Baths', data.baths],
    ['Sqft', data.sqft ? Number(data.sqft).toLocaleString() : ''],
    ['Year Built', data.year_built],
  ].filter(([_, v]) => v);

  container.innerHTML = fields.map(([label, value]) =>
    `<div class="row"><span class="label">${label}</span><span class="value">${value}</span></div>`
  ).join('');

  document.getElementById('extracted-data').style.display = 'block';
  document.getElementById('send-btn').style.display = 'block';
}

async function handleSend() {
  const btn = document.getElementById('send-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Sending...';

  try {
    const { token, lastExtracted } = await chrome.storage.local.get(['token', 'lastExtracted']);

    if (!token || !lastExtracted) {
      alert('No data to send');
      return;
    }

    const res = await fetch(`${apiUrl}/api/extension/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(lastExtracted),
    });

    const data = await res.json();

    if (data.success) {
      document.getElementById('status-text').textContent = 'Sent to DealEval!';
      btn.textContent = 'Sent!';
      btn.style.background = '#ecfdf5';
      btn.style.color = '#065f46';

      chrome.action.setBadgeText({ text: '1' });
      chrome.action.setBadgeBackgroundColor({ color: '#10b981' });

      setTimeout(() => {
        const evalUrl = `${apiUrl.replace(':3000', ':5173')}${data.data.evaluateUrl}`;
        chrome.tabs.create({ url: evalUrl });
      }, 500);
    } else {
      alert(data.error || 'Failed to send');
    }
  } catch (err) {
    alert('Connection failed. Is DealEval running?');
  } finally {
    btn.disabled = false;
  }
}

function switchTab(mode) {
  const extractTab = document.getElementById('tab-extract');
  const searchTab = document.getElementById('tab-search');
  const extractMode = document.getElementById('extract-mode');
  const searchMode = document.getElementById('search-mode');

  if (mode === 'extract') {
    extractTab.style.borderBottomColor = '#4f46e5';
    extractTab.style.color = '#4f46e5';
    searchTab.style.borderBottomColor = 'transparent';
    searchTab.style.color = '#6b7280';
    extractMode.style.display = 'block';
    searchMode.style.display = 'none';
  } else {
    searchTab.style.borderBottomColor = '#4f46e5';
    searchTab.style.color = '#4f46e5';
    extractTab.style.borderBottomColor = 'transparent';
    extractTab.style.color = '#6b7280';
    extractMode.style.display = 'none';
    searchMode.style.display = 'block';
  }
}

function updateSiteCheckboxes() {
  const propertyType = document.getElementById('search-type').value;
  const siteList = document.getElementById('site-list');
  const sites = window.SiteSearchUrls.getSitesForPropertyType(propertyType);

  siteList.innerHTML = sites.map(site =>
    `<label style="display:flex;align-items:center;gap:4px;font-size:12px;color:#374151;">
      <input type="checkbox" class="site-cb" value="${site.name}" checked style="accent-color:#4f46e5;" />
      ${site.name}
    </label>`
  ).join('');
}

async function handleOpenSites() {
  const city = document.getElementById('search-city').value;
  const state = document.getElementById('search-state').value;
  const zip = document.getElementById('search-zip').value;

  if (!city && !state && !zip) {
    alert('Enter at least a city/state or zip code');
    return;
  }

  const btn = document.getElementById('open-sites-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Opening sites...';

  const propertyType = document.getElementById('search-type').value;
  const minPrice = document.getElementById('search-min-price').value;
  const maxPrice = document.getElementById('search-max-price').value;
  const listedWithin = document.getElementById('search-listed-within').value;

  const selectedSites = Array.from(document.querySelectorAll('.site-cb:checked')).map(cb => cb.value);

  const allUrls = window.SiteSearchUrls.buildSearchUrls({
    city, state, zip, propertyType, minPrice, maxPrice, listedWithin,
  });

  const urlsToOpen = allUrls.filter(u => selectedSites.includes(u.name));

  if (urlsToOpen.length === 0) {
    btn.disabled = false;
    btn.textContent = 'Open Search on Selected Sites';
    alert('Select at least one site');
    return;
  }

  // Clear previous results
  await chrome.storage.local.remove(['siteSearchResults']);

  // Open each site in a new tab and track tab IDs
  const tabIds = [];
  for (const u of urlsToOpen) {
    const tab = await chrome.tabs.create({ url: u.url, active: false });
    tabIds.push({ id: tab.id, source: u.hostname });
  }

  btn.innerHTML = '<span class="spinner"></span> Waiting for pages to load...';

  // Wait for pages to load, then scrape each tab
  setTimeout(async () => {
    btn.innerHTML = '<span class="spinner"></span> Scraping listings...';
    const allResults = [];

    for (const { id: tabId, source } of tabIds) {
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId },
          func: scrapeAnySearchPage,
        });
        const data = results[0]?.result;
        if (data && data.length > 0) {
          // Tag each result with source
          data.forEach(r => { r.source = source; });
          allResults.push(...data);
        }
      } catch (err) {
        console.error(`DealEval: Failed to scrape tab ${tabId}:`, err);
      }
    }

    // Deduplicate by address
    const seen = new Set();
    const unique = [];
    for (const r of allResults) {
      const key = (r.address || '').toLowerCase().trim();
      if (!key || key.length < 4 || seen.has(key)) continue;
      if (/commercial real estate|for sale|properties for|auctions/i.test(key)) continue;
      seen.add(key);
      unique.push(r);
    }

    // Store results and notify background to forward to DealEval
    if (unique.length > 0) {
      await chrome.storage.local.set({ siteSearchResults: unique });
      chrome.runtime.sendMessage({
        type: 'SEARCH_RESULTS_SCRAPED',
        data: unique,
        source: 'multi-site',
      });
      btn.textContent = `Found ${unique.length} listings!`;
      btn.style.background = '#ecfdf5';
      btn.style.color = '#065f46';
      btn.style.borderColor = '#a7f3d0';
    } else {
      btn.textContent = 'No listings found - try again';
      btn.style.background = '#fffbeb';
      btn.style.color = '#92400e';
      // Retry once more after another delay
      setTimeout(async () => {
        btn.innerHTML = '<span class="spinner"></span> Retrying...';
        const retryResults = [];
        for (const { id: tabId, source } of tabIds) {
          try {
            const results = await chrome.scripting.executeScript({
              target: { tabId },
              func: scrapeAnySearchPage,
            });
            const data = results[0]?.result;
            if (data && data.length > 0) {
              data.forEach(r => { r.source = source; });
              retryResults.push(...data);
            }
          } catch (err) {}
        }
        const retrySeen = new Set();
        const retryUnique = [];
        for (const r of retryResults) {
          const key = (r.address || '').toLowerCase().trim();
          if (!key || key.length < 4 || retrySeen.has(key)) continue;
          if (/commercial real estate|for sale|properties for|auctions/i.test(key)) continue;
          retrySeen.add(key);
          retryUnique.push(r);
        }
        if (retryUnique.length > 0) {
          await chrome.storage.local.set({ siteSearchResults: retryUnique });
          chrome.runtime.sendMessage({
            type: 'SEARCH_RESULTS_SCRAPED',
            data: retryUnique,
            source: 'multi-site',
          });
          btn.textContent = `Found ${retryUnique.length} listings!`;
          btn.style.background = '#ecfdf5';
          btn.style.color = '#065f46';
        } else {
          btn.textContent = 'No listings extracted';
        }
        setTimeout(() => {
          btn.disabled = false;
          btn.textContent = 'Open Search on Selected Sites';
          btn.style.background = '';
          btn.style.color = '';
          btn.style.borderColor = '';
        }, 3000);
      }, 8000);
    }

    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = 'Open Search on Selected Sites';
      btn.style.background = '';
      btn.style.color = '';
      btn.style.borderColor = '';
    }, 5000);
  }, 8000); // Wait 8s for pages to load

  chrome.storage.local.set({
    lastSearch: { city, state, zip, propertyType, minPrice, maxPrice, listedWithin },
  });
}

// Universal scraper function - injected into any search results page
function scrapeAnySearchPage() {
  const listings = [];
  const seen = new Set();

  // Collect ALL links on the page that look like property detail links
  const allLinks = document.querySelectorAll('a[href]');
  const propertyLinks = [];

  for (const link of allLinks) {
    const href = link.href;
    if (!href) continue;
    // Match common property detail URL patterns
    if (href.match(/\/Listing\/|\/homedetails\/|\/realestateandhomes-detail\/|\/property\/\d/i)) {
      if (!seen.has(href)) {
        seen.add(href);
        propertyLinks.push(link);
      }
    }
  }

  for (let idx = 0; idx < propertyLinks.length; idx++) {
    const link = propertyLinks[idx];
    try {
      // Find closest card container
      let container = link.closest('article, li, [class*="card" i], [class*="placard" i], [class*="result" i], [role="listitem"]');
      if (!container) {
        container = link.parentElement;
        for (let i = 0; i < 3; i++) {
          if (container && container.parentElement && container.parentElement.textContent.length < 2000) {
            container = container.parentElement;
          } else break;
        }
      }
      if (!container) continue;

      const text = container.textContent || '';
      if (text.length > 2000) continue; // Too big = not a card

      const listing = {
        id: `scraped-${idx}-${Date.now()}`,
        source_url: link.href,
        property_type: 'Commercial',
      };

      // Address from headings in container
      const headings = container.querySelectorAll('h1, h2, h3, h4, h5, a[class*="title" i], [class*="name" i], [class*="address" i]');
      for (const h of headings) {
        const t = h.textContent.trim();
        if (t.length > 3 && t.length < 120 && !t.includes('$') && !/commercial real estate|for sale|auctions|properties for/i.test(t)) {
          listing.address = t;
          break;
        }
      }
      if (!listing.address) {
        const linkText = link.textContent.trim();
        if (linkText.length > 3 && linkText.length < 120 && !/view|more|detail/i.test(linkText)) {
          listing.address = linkText;
        }
      }
      if (!listing.address) continue;

      // Price
      const prices = text.match(/\$\s*([\d,]+(?:\.\d+)?)\s*(M|K)?/g);
      if (prices && prices.length > 0) {
        // Take the first price in the card
        const m = prices[0].match(/\$\s*([\d,]+(?:\.\d+)?)\s*(M|K)?/);
        if (m) {
          let price = parseFloat(m[1].replace(/,/g, ''));
          if (m[2] === 'M') price *= 1000000;
          else if (m[2] === 'K') price *= 1000;
          if (price > 0 && price < 5000000000) listing.price = price;
        }
      }

      // Sqft
      const sqftMatch = text.match(/([\d,]+)\s*(?:SF|sq\.?\s*ft|sqft)/i);
      if (sqftMatch) listing.sqft = parseInt(sqftMatch[1].replace(/,/g, ''));

      // Beds/baths (residential)
      const bedsMatch = text.match(/(\d+)\s*(?:bd|bed|bds|bedroom)/i);
      const bathsMatch = text.match(/(\d+\.?\d*)\s*(?:ba|bath)/i);
      if (bedsMatch) listing.beds = parseInt(bedsMatch[1]);
      if (bathsMatch) listing.baths = parseFloat(bathsMatch[1]);

      // Location
      const locMatch = text.match(/([A-Z][a-zA-Z\s]+?),\s*([A-Z]{2})(?:\s+(\d{5}))?/);
      if (locMatch) {
        listing.city = locMatch[1].trim();
        listing.state = locMatch[2];
        if (locMatch[3]) listing.zip = locMatch[3];
      }

      // Detect residential vs commercial
      if (listing.beds || listing.baths || link.href.match(/homedetails|realestateandhomes/)) {
        listing.property_type = 'Residential';
      }

      listings.push(listing);
    } catch (err) {}
  }

  return listings;
}

async function handleLogout() {
  await chrome.storage.local.remove(['token', 'userEmail', 'lastExtracted']);
  chrome.action.setBadgeText({ text: '' });
  showAuthSection();
}

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

function handleOpenSites() {
  const city = document.getElementById('search-city').value;
  const state = document.getElementById('search-state').value;
  const zip = document.getElementById('search-zip').value;

  if (!city && !state && !zip) {
    alert('Enter at least a city/state or zip code');
    return;
  }

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
    alert('Select at least one site');
    return;
  }

  urlsToOpen.forEach(u => {
    chrome.tabs.create({ url: u.url, active: false });
  });

  // Save search params for reuse
  chrome.storage.local.set({
    lastSearch: { city, state, zip, propertyType, minPrice, maxPrice, listedWithin },
  });
}

async function handleLogout() {
  await chrome.storage.local.remove(['token', 'userEmail', 'lastExtracted']);
  chrome.action.setBadgeText({ text: '' });
  showAuthSection();
}

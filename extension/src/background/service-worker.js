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

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url) return;

  const isSupported = SUPPORTED_PATTERNS.some(pattern => {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(tab.url);
  });

  if (isSupported) {
    chrome.action.setIcon({
      tabId,
      path: { 16: '/icons/icon16.png', 48: '/icons/icon48.png' },
    }).catch(() => {});
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EXTRACTION_COMPLETE') {
    chrome.storage.local.set({ lastExtracted: message.data });
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#4f46e5' });

    chrome.notifications.create({
      type: 'basic',
      iconUrl: '/icons/icon128.png',
      title: 'Property Extracted',
      message: `${message.data.address || 'Property'} data ready to send to DealEval`,
    }).catch(() => {});

    sendResponse({ success: true });
  }

  if (message.type === 'GET_AUTH') {
    chrome.storage.local.get(['token']).then(result => {
      sendResponse({ token: result.token || null });
    });
    return true;
  }

  // Clear previous results when a new site search starts
  if (message.type === 'CLEAR_SITE_RESULTS') {
    chrome.storage.local.remove(['siteSearchResults']);
    chrome.action.setBadgeText({ text: '' });
    sendResponse({ success: true });
    return;
  }

  // Handle search results scraped from site search pages
  if (message.type === 'SEARCH_RESULTS_SCRAPED') {
    const newResults = message.data || [];
    const source = message.source || 'unknown';
    console.log(`DealEval BG: Received ${newResults.length} results from ${source}`);

    // Merge with existing stored results, dedup by source_url AND address
    chrome.storage.local.get(['siteSearchResults'], (stored) => {
      const existing = stored.siteSearchResults || [];
      const seen = new Set();
      // Build dedup keys from existing
      existing.forEach(r => {
        if (r.source_url) seen.add(r.source_url);
        if (r.address) seen.add(r.address);
      });
      const merged = [...existing];

      for (const r of newResults) {
        // Skip if we already have this listing by URL or address
        if (r.source_url && seen.has(r.source_url)) continue;
        if (r.address && seen.has(r.address)) continue;
        if (r.source_url) seen.add(r.source_url);
        if (r.address) seen.add(r.address);
        merged.push(r);
      }

      console.log(`DealEval BG: Total ${merged.length} results after merge`);

      chrome.storage.local.set({ siteSearchResults: merged });

      // Update badge with count
      chrome.action.setBadgeText({ text: String(merged.length) });
      chrome.action.setBadgeBackgroundColor({ color: '#10b981' });

      // Forward results to any open DealEval tabs
      chrome.tabs.query({ url: 'http://localhost:*/*' }, (tabs) => {
        for (const tab of tabs) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'SITE_SEARCH_RESULTS',
            data: merged,
            source: source,
          }).catch(() => {});
        }
      });
    });

    sendResponse({ success: true });
    return true;
  }
});

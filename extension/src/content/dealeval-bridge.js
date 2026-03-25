// DealEval Bridge - runs on localhost DealEval pages
// Receives scraped search results from background worker and writes to window.localStorage
// so the React SearchPage can read and display them.
(function () {
  // Listen for results pushed from background worker
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'SITE_SEARCH_RESULTS') {
      try {
        // Merge with any existing results in localStorage
        const existing = JSON.parse(window.localStorage.getItem('siteSearchResults') || '[]');
        const newResults = msg.data || [];

        // Deduplicate by source_url or address
        const seen = new Set(existing.map(r => r.source_url || r.address));
        const merged = [...existing];
        for (const r of newResults) {
          const key = r.source_url || r.address;
          if (key && !seen.has(key)) {
            seen.add(key);
            merged.push(r);
          }
        }

        window.localStorage.setItem('siteSearchResults', JSON.stringify(merged));
        window.localStorage.setItem('siteSearchResultsTimestamp', String(Date.now()));
        window.localStorage.setItem('siteSearchSource', msg.source || 'unknown');

        // Dispatch a custom event so React can pick it up immediately
        window.dispatchEvent(new CustomEvent('dealeval-site-results', {
          detail: { results: merged, source: msg.source },
        }));

        sendResponse({ success: true, count: merged.length });
      } catch (err) {
        console.error('DealEval bridge error:', err);
        sendResponse({ success: false, error: err.message });
      }
    }
  });

  // Also check chrome.storage.local on page load for any pending results
  chrome.storage.local.get(['siteSearchResults'], (result) => {
    if (result.siteSearchResults && result.siteSearchResults.length > 0) {
      window.localStorage.setItem('siteSearchResults', JSON.stringify(result.siteSearchResults));
      window.localStorage.setItem('siteSearchResultsTimestamp', String(Date.now()));

      window.dispatchEvent(new CustomEvent('dealeval-site-results', {
        detail: { results: result.siteSearchResults },
      }));
    }
  });
})();

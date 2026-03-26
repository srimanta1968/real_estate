console.log('DealEval: Bridge script LOADED on', window.location.href);
// DealEval Bridge - runs on localhost DealEval pages
// Receives scraped search results from background worker and writes to window.localStorage
(function () {
  // Listen for messages from the React app (via window.postMessage)
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;

    if (event.data?.type === 'DEALEVAL_CLEAR_SITE_RESULTS') {
      console.log('DealEval: Clearing site search results');
      window.localStorage.removeItem('siteSearchResults');
      window.localStorage.removeItem('siteSearchResultsTimestamp');
      chrome.storage.local.remove(['siteSearchResults']);
    }

    // Forward site search request to background worker
    if (event.data?.type === 'DEALEVAL_START_SITE_SEARCH') {
      console.log('DealEval: Forwarding START_SITE_SEARCH to background worker');
      chrome.runtime.sendMessage({
        type: 'START_SITE_SEARCH',
        urls: event.data.urls || [],
      });
    }
  });

  // Listen for results pushed from background worker
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'SITE_SEARCH_RESULTS') {
      try {
        const newResults = msg.data || [];
        console.log(`DealEval: Bridge received ${newResults.length} results from ${msg.source}`);

        // Just write the results directly (background already deduped)
        window.localStorage.setItem('siteSearchResults', JSON.stringify(newResults));
        window.localStorage.setItem('siteSearchResultsTimestamp', String(Date.now()));
        window.localStorage.setItem('siteSearchSource', msg.source || 'unknown');

        // Dispatch custom event so React picks it up immediately
        window.dispatchEvent(new CustomEvent('dealeval-site-results', {
          detail: { results: newResults, source: msg.source },
        }));

        sendResponse({ success: true, count: newResults.length });
      } catch (err) {
        console.error('DealEval bridge error:', err);
        sendResponse({ success: false, error: err.message });
      }
    }
  });

  // On page load, check chrome.storage.local for any pending results
  chrome.storage.local.get(['siteSearchResults'], (result) => {
    if (result.siteSearchResults && result.siteSearchResults.length > 0) {
      console.log(`DealEval: Bridge found ${result.siteSearchResults.length} pending results`);
      window.localStorage.setItem('siteSearchResults', JSON.stringify(result.siteSearchResults));
      window.localStorage.setItem('siteSearchResultsTimestamp', String(Date.now()));

      window.dispatchEvent(new CustomEvent('dealeval-site-results', {
        detail: { results: result.siteSearchResults },
      }));
    }
  });
})();

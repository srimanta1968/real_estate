// LoopNet search results page scraper
console.log('DealEval: LoopNet search scraper LOADED on', window.location.href);
(function () {
  let alreadySent = false;

  // If the URL has #dealeval-loc=..., fill LoopNet's location search box and submit
  function applyLocationFilter() {
    const hash = window.location.hash || '';
    const match = hash.match(/dealeval-loc=([^&]+)/);
    if (!match) return;
    const location = decodeURIComponent(match[1]);
    console.log('DealEval: Filling LoopNet location filter with:', location);

    // LoopNet's search input selectors (they use various layouts)
    const selectors = [
      'input[data-testid="search-input"]',
      'input[placeholder*="Search"]',
      'input[placeholder*="search"]',
      'input[placeholder*="location"]',
      'input[placeholder*="Location"]',
      'input[placeholder*="city"]',
      'input[placeholder*="address"]',
      'input[aria-label*="Search"]',
      'input[aria-label*="Location"]',
      '.search-input input',
      '#searchInput',
      'input.autocomplete-input',
      'input[name="SearchCriteria.Location"]',
      'input[type="search"]',
    ];

    let searchInput = null;
    for (const sel of selectors) {
      searchInput = document.querySelector(sel);
      if (searchInput) break;
    }

    if (!searchInput) {
      // Fallback: find any visible text input in the header/search area
      const inputs = document.querySelectorAll('header input[type="text"], .search-bar input, form input[type="text"]');
      for (const inp of inputs) {
        if (inp.offsetParent !== null) { searchInput = inp; break; }
      }
    }

    if (searchInput) {
      // Clear and set value
      searchInput.value = '';
      searchInput.focus();
      // Simulate typing so React/Angular bindings pick it up
      const nativeSet = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSet.call(searchInput, location);
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      searchInput.dispatchEvent(new Event('change', { bubbles: true }));

      // Wait for autocomplete suggestions, then submit
      setTimeout(() => {
        // Try clicking the first autocomplete suggestion
        const suggestion = document.querySelector(
          '.autocomplete-suggestions li, .search-suggestions li, [class*="suggestion"] li, ' +
          '[class*="Suggestion"] li, [role="option"], [class*="dropdown"] li, [class*="result"] li'
        );
        if (suggestion) {
          console.log('DealEval: Clicking autocomplete suggestion:', suggestion.textContent.trim());
          suggestion.click();
        } else {
          // No suggestions — press Enter to submit the search
          searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
          // Also try clicking any search/submit button
          const submitBtn = document.querySelector(
            'button[type="submit"], button[aria-label*="Search"], button[class*="search"], .search-button, [data-testid="search-button"]'
          );
          if (submitBtn) submitBtn.click();
        }

        // Clean the hash so it doesn't persist
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }, 2000);
    } else {
      console.warn('DealEval: Could not find LoopNet search input');
    }
  }

  // Apply location filter after page loads
  if (window.location.hash.includes('dealeval-loc=')) {
    if (document.readyState === 'complete') {
      setTimeout(applyLocationFilter, 2000);
    } else {
      window.addEventListener('load', () => setTimeout(applyLocationFilter, 2000));
    }
  }

  function scrapeSearchResults() {
    const listings = [];
    const seenIds = new Set();

    // Primary: use article.placard elements which have rich gtm-listing-* attributes
    const placards = document.querySelectorAll('article.placard');
    console.log(`DealEval: Found ${placards.length} placard articles on LoopNet`);

    placards.forEach((article) => {
      try {
        const listingId = article.getAttribute('gtm-listing-id') || article.getAttribute('data-id');
        if (!listingId || seenIds.has(listingId)) return;
        seenIds.add(listingId);

        // Source URL from first listing link
        const linkEl = article.querySelector('a[href*="/Listing/"]');
        const sourceUrl = linkEl ? linkEl.href : '';

        // Read pre-parsed data from GTM attributes
        const city = article.getAttribute('gtm-listing-city') || '';
        const state = article.getAttribute('gtm-listing-state') || '';
        const zip = article.getAttribute('gtm-listing-zip') || '';
        const propTypeName = article.getAttribute('gtm-listing-property-type-name') || 'Commercial';

        const listing = {
          id: `loopnet-${listingId}`,
          source: 'loopnet.com',
          source_url: sourceUrl,
          property_type: propTypeName,
          city,
          state,
          zip,
        };

        // Address from h4 links (tier1 uses a.left-h4, tier4 uses h4 > a)
        const addrEl = article.querySelector('a.left-h4, h4 a');
        if (addrEl) {
          listing.address = addrEl.textContent.trim();
        }
        if (!listing.address || listing.address.length < 3) return;

        // Extract price, sqft, cap rate, year built from ALL li inside .placard-info
        const dataLis = article.querySelectorAll('.placard-info li');
        for (const li of dataLis) {
          const t = li.textContent.trim();

          // Price: first li containing a $ amount
          if (!listing.price && t.includes('$')) {
            const priceMatch = t.match(/\$\s*([\d,]+(?:\.\d+)?)\s*(M|K)?/);
            if (priceMatch) {
              let price = parseFloat(priceMatch[1].replace(/,/g, ''));
              if (priceMatch[2] === 'M') price *= 1000000;
              else if (priceMatch[2] === 'K') price *= 1000;
              if (price > 0 && price < 10000000000) listing.price = price;
            }
          }

          const sqftMatch = t.match(/([\d,]+)\s*SF\b/i);
          if (sqftMatch && !listing.sqft) listing.sqft = parseInt(sqftMatch[1].replace(/,/g, ''));

          const capMatch = t.match(/([\d.]+)\s*%\s*Cap/i);
          if (capMatch) listing.cap_rate = parseFloat(capMatch[1]);

          const yearMatch = t.match(/Built\s+in\s+(\d{4})/i);
          if (yearMatch) listing.year_built = parseInt(yearMatch[1]);
        }

        // Fallback: if no price from li elements, try the whole placard-info text
        if (!listing.price) {
          const infoEl = article.querySelector('.placard-info');
          if (infoEl) {
            const infoText = infoEl.textContent || '';
            const pm = infoText.match(/\$\s*([\d,]+(?:\.\d+)?)\s*(M|K)?/);
            if (pm) {
              let price = parseFloat(pm[1].replace(/,/g, ''));
              if (pm[2] === 'M') price *= 1000000;
              else if (pm[2] === 'K') price *= 1000;
              if (price > 0 && price < 10000000000) listing.price = price;
            }
          }
        }

        listings.push(listing);
      } catch (err) {
        console.error('DealEval: LoopNet card scrape error:', err);
      }
    });

    // Fallback: if no placards found, try generic link-based scraping
    if (listings.length === 0) {
      const allLinks = document.querySelectorAll('a[href*="/Listing/"]');
      const seenUrls = new Set();
      allLinks.forEach((link, idx) => {
        try {
          const href = link.href;
          if (!href || seenUrls.has(href)) return;
          seenUrls.add(href);
          const container = link.closest('article, li, [role="listitem"]');
          if (!container || container.textContent.length > 3000) return;
          const text = container.textContent || '';
          const listing = { id: `loopnet-${idx}-${Date.now()}`, source: 'loopnet.com', source_url: href, property_type: 'Commercial' };
          const addrEl = container.querySelector('h4 a, h3 a');
          if (addrEl) listing.address = addrEl.textContent.trim();
          if (!listing.address || listing.address.length < 3) return;
          const pm = text.match(/\$\s*([\d,]+(?:\.\d+)?)\s*(M|K)?/);
          if (pm) {
            let price = parseFloat(pm[1].replace(/,/g, ''));
            if (pm[2] === 'M') price *= 1000000;
            else if (pm[2] === 'K') price *= 1000;
            if (price > 0 && price < 10000000000) listing.price = price;
          }
          const sm = text.match(/([\d,]+)\s*SF\b/i);
          if (sm) listing.sqft = parseInt(sm[1].replace(/,/g, ''));
          const lm = text.match(/([A-Z][a-zA-Z\s]+?),\s*([A-Z]{2})(?:\s+(\d{5}))?/);
          if (lm) { listing.city = lm[1].trim(); listing.state = lm[2]; if (lm[3]) listing.zip = lm[3]; }
          listings.push(listing);
        } catch (err) {}
      });
    }

    console.log(`DealEval: Extracted ${listings.length} unique listings from LoopNet`);
    return listings;
  }

  function scrapeAndSend() {
    const results = scrapeSearchResults();
    // Only send if we have results WITH prices (skip incomplete early scrapes)
    const hasAnyPrice = results.some(r => r.price > 0);
    if (results.length > 0 && hasAnyPrice) {
      console.log(`DealEval: Sending ${results.length} LoopNet listings (${results.filter(r => r.price > 0).length} with prices)`);
      chrome.runtime.sendMessage({
        type: 'SEARCH_RESULTS_SCRAPED',
        data: results,
        source: 'loopnet.com',
        pageUrl: window.location.href,
      }).catch(err => console.error('DealEval: Message send error:', err));
      alreadySent = true;
    } else if (results.length > 0) {
      console.log(`DealEval: Found ${results.length} LoopNet placards but no prices yet, will retry...`);
    }
  }

  // Retry with increasing delays — LoopNet's Angular app needs time to render prices
  function startScraping() {
    setTimeout(scrapeAndSend, 5000);
    setTimeout(scrapeAndSend, 10000);
    setTimeout(scrapeAndSend, 15000);
    // Final attempt at 20s in case Angular rendering is very slow
    setTimeout(() => {
      if (!alreadySent) {
        // Send whatever we have, even without prices
        const results = scrapeSearchResults();
        if (results.length > 0) {
          console.log(`DealEval: Final attempt — sending ${results.length} LoopNet listings`);
          chrome.runtime.sendMessage({
            type: 'SEARCH_RESULTS_SCRAPED',
            data: results,
            source: 'loopnet.com',
            pageUrl: window.location.href,
          }).catch(err => console.error('DealEval: Message send error:', err));
        }
      }
    }, 20000);
  }

  if (document.readyState === 'complete') {
    startScraping();
  } else {
    window.addEventListener('load', startScraping);
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'SCRAPE_SEARCH') {
      sendResponse({ results: scrapeSearchResults() });
    }
  });
})();

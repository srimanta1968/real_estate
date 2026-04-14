// Crexi search results page scraper
console.log('DealEval: Crexi search scraper LOADED on', window.location.href);
(function () {
  let alreadySent = false;

  // If the URL has #dealeval-loc=..., fill Crexi's location search box and submit
  function applyLocationFilter() {
    const hash = window.location.hash || '';
    const match = hash.match(/dealeval-loc=([^&]+)/);
    if (!match) return;
    const location = decodeURIComponent(match[1]);
    console.log('DealEval: Filling Crexi location filter with:', location);

    // Crexi search input selectors
    const selectors = [
      'input[data-cy="searchInput"]',
      'input[placeholder*="Search"]',
      'input[placeholder*="search"]',
      'input[placeholder*="location"]',
      'input[placeholder*="Location"]',
      'input[placeholder*="city"]',
      'input[placeholder*="address"]',
      'input[placeholder*="Enter"]',
      'input[aria-label*="Search"]',
      'input[aria-label*="Location"]',
      'input[type="search"]',
      '.search-input input',
      '[class*="search"] input[type="text"]',
      'header input[type="text"]',
      'input[name="search"]',
    ];

    let searchInput = null;
    for (const sel of selectors) {
      searchInput = document.querySelector(sel);
      if (searchInput) {
        console.log('DealEval: Found Crexi search input via:', sel);
        break;
      }
    }

    // Fallback: find any visible text input in top area
    if (!searchInput) {
      const inputs = document.querySelectorAll('input[type="text"], input[type="search"], input:not([type])');
      for (const inp of inputs) {
        if (inp.offsetParent !== null && inp.getBoundingClientRect().top < 200) {
          searchInput = inp;
          console.log('DealEval: Found Crexi search input via fallback');
          break;
        }
      }
    }

    if (searchInput) {
      searchInput.value = '';
      searchInput.focus();
      // Simulate typing so Angular/React bindings pick it up
      const nativeSet = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSet.call(searchInput, location);
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      searchInput.dispatchEvent(new Event('change', { bubbles: true }));
      searchInput.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
      searchInput.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));

      // Wait for autocomplete suggestions, then click or submit
      setTimeout(() => {
        const suggestion = document.querySelector(
          '[class*="suggestion"] li, [class*="Suggestion"] li, [role="option"], ' +
          '[class*="dropdown"] li, [class*="result"] li, [class*="autocomplete"] li, ' +
          '[class*="search-result"] button, [class*="search-result"] a'
        );
        if (suggestion) {
          console.log('DealEval: Clicking Crexi autocomplete suggestion:', suggestion.textContent.trim());
          suggestion.click();
        } else {
          // No suggestions — press Enter
          searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
          searchInput.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
          searchInput.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
          // Also try clicking a search/submit button
          const submitBtn = document.querySelector(
            'button[type="submit"], button[aria-label*="Search"], button[class*="search"], [data-cy="searchButton"]'
          );
          if (submitBtn) submitBtn.click();
        }

        // Clean the hash
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }, 2500);
    } else {
      console.warn('DealEval: Could not find Crexi search input');
    }
  }

  // Apply location filter after page loads
  if (window.location.hash.includes('dealeval-loc=')) {
    if (document.readyState === 'complete') {
      setTimeout(applyLocationFilter, 3000);
    } else {
      window.addEventListener('load', () => setTimeout(applyLocationFilter, 3000));
    }
  }

  function scrapeSearchResults() {
    const listings = [];
    const seen = new Set();

    const allLinks = document.querySelectorAll('a[href*="/properties/"], a[href*="/property/"]');
    console.log(`DealEval: Found ${allLinks.length} property links on Crexi`);

    allLinks.forEach((link) => {
      try {
        const href = link.href;
        // Skip query-only links and already seen
        if (!href || seen.has(href) || href.endsWith('/properties') || href.endsWith('/properties/')) return;
        seen.add(href);

        let container = link.closest('article, [class*="card"], [class*="Card"], [class*="listing"], li, [role="listitem"]');
        if (!container) {
          container = link.parentElement;
          for (let i = 0; i < 3; i++) {
            if (container.parentElement && container.parentElement.textContent.length < 3000) {
              container = container.parentElement;
            } else {
              break;
            }
          }
        }

        const text = container.textContent || '';
        if (text.length > 3000) return;

        const listing = {
          id: `crexi-${listings.length}-${Date.now()}`,
          source: 'crexi.com',
          source_url: href.startsWith('http') ? href : `https://www.crexi.com${href}`,
          property_type: 'Commercial',
        };

        const headings = container.querySelectorAll('h1, h2, h3, h4, h5, [class*="title" i], [class*="name" i], [class*="address" i]');
        for (const h of headings) {
          const t = h.textContent.trim();
          if (t.length > 3 && t.length < 150 && !t.includes('$') && !t.match(/commercial|for sale|properties/i)) {
            listing.address = t;
            break;
          }
        }
        if (!listing.address) {
          const linkText = link.textContent.trim();
          if (linkText.length > 3 && linkText.length < 150 && !linkText.match(/view|detail|more|properties/i)) {
            listing.address = linkText;
          }
        }
        if (!listing.address) return;

        const priceMatch = text.match(/\$\s*([\d,]+(?:\.\d+)?)\s*(M|K)?/);
        if (priceMatch) {
          let price = parseFloat(priceMatch[1].replace(/,/g, ''));
          if (priceMatch[2] === 'M') price *= 1000000;
          else if (priceMatch[2] === 'K') price *= 1000;
          if (price < 10000000000) listing.price = price;
        }

        const sqftMatch = text.match(/([\d,]+)\s*(?:SF|sq\.?\s*ft|sqft)/i);
        if (sqftMatch) listing.sqft = parseInt(sqftMatch[1].replace(/,/g, ''));

        const capMatch = text.match(/([\d.]+)\s*%\s*(?:cap)/i);
        if (capMatch) listing.cap_rate = parseFloat(capMatch[1]);

        const locMatch = text.match(/([A-Z][a-zA-Z\s]+?),\s*([A-Z]{2})(?:\s+(\d{5}))?/);
        if (locMatch) {
          listing.city = locMatch[1].trim();
          listing.state = locMatch[2];
          if (locMatch[3]) listing.zip = locMatch[3];
        }

        listings.push(listing);
      } catch (err) {
        console.error('DealEval: Crexi card scrape error:', err);
      }
    });

    console.log(`DealEval: Extracted ${listings.length} unique listings from Crexi`);
    return listings;
  }

  function scrapeAndSend() {
    const results = scrapeSearchResults();
    if (results.length > 0 && !alreadySent) {
      alreadySent = true;
      chrome.runtime.sendMessage({
        type: 'SEARCH_RESULTS_SCRAPED',
        data: results,
        source: 'crexi.com',
        pageUrl: window.location.href,
      }).catch(err => console.error('DealEval: Message send error:', err));
    }
  }

  function startScraping() {
    setTimeout(scrapeAndSend, 3000);
    setTimeout(scrapeAndSend, 7000);
    setTimeout(scrapeAndSend, 12000);
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

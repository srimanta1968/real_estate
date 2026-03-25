// Crexi search results page scraper
(function () {
  function scrapeSearchResults() {
    const listings = [];

    const cards = document.querySelectorAll(
      '[class*="listing-card"], [class*="PropertyCard"], [class*="search-result"], .property-card, article'
    );

    cards.forEach((card, idx) => {
      try {
        const listing = {
          id: `crexi-search-${idx}-${Date.now()}`,
          source: 'crexi.com',
          source_url: '',
        };

        const link = card.querySelector('a[href*="/properties/"]');
        if (link) listing.source_url = link.href.startsWith('http') ? link.href : `https://www.crexi.com${link.href}`;

        const titleEl = card.querySelector('h2, h3, [class*="title"], [class*="address"]');
        if (titleEl) listing.address = titleEl.textContent.trim();

        const locEl = card.querySelector('[class*="location"], [class*="subtitle"], [class*="city"]');
        if (locEl) {
          const parts = locEl.textContent.trim().split(',').map(s => s.trim());
          if (parts.length >= 2) {
            listing.city = parts[0];
            const stateZip = parts[parts.length - 1].trim().split(/\s+/);
            listing.state = stateZip[0];
            if (stateZip[1]) listing.zip = stateZip[1];
          }
        }

        const priceEl = card.querySelector('[class*="price"], [class*="Price"]');
        if (priceEl) {
          const priceText = priceEl.textContent.replace(/[^0-9.]/g, '');
          if (priceText) listing.price = parseFloat(priceText);
        }

        const text = card.textContent;
        const sqftMatch = text.match(/([\d,]+)\s*(?:SF|sq\s*ft|sqft)/i);
        if (sqftMatch) listing.sqft = parseInt(sqftMatch[1].replace(/,/g, ''));

        const capMatch = text.match(/([\d.]+)%\s*(?:cap|CAP)/i);
        if (capMatch) listing.cap_rate = parseFloat(capMatch[1]);

        const typeEl = card.querySelector('[class*="type"], [class*="Type"]');
        if (typeEl) listing.property_type = typeEl.textContent.trim();
        if (!listing.property_type) listing.property_type = 'Commercial';

        if (listing.address || listing.price) {
          listings.push(listing);
        }
      } catch (err) {
        console.error('DealEval: Error scraping Crexi card:', err);
      }
    });

    return listings;
  }

  function scrapeAndSend() {
    const results = scrapeSearchResults();
    if (results.length > 0) {
      chrome.runtime.sendMessage({
        type: 'SEARCH_RESULTS_SCRAPED',
        data: results,
        source: 'crexi.com',
        pageUrl: window.location.href,
      });
    }
  }

  if (document.readyState === 'complete') {
    setTimeout(scrapeAndSend, 2000);
  } else {
    window.addEventListener('load', () => setTimeout(scrapeAndSend, 2000));
  }

  let scrollTimeout;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(scrapeAndSend, 3000);
  });

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'SCRAPE_SEARCH') {
      sendResponse({ results: scrapeSearchResults() });
    }
  });
})();

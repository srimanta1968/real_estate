// LoopNet search results page scraper
// Extracts listing cards from search results and sends to background worker
(function () {
  function scrapeSearchResults() {
    const listings = [];

    // LoopNet listing cards use various selectors
    const cards = document.querySelectorAll(
      'article.placard, .placard-pseudo-link, [class*="ListingCard"], .listing-card'
    );

    cards.forEach((card, idx) => {
      try {
        const listing = {
          id: `loopnet-search-${idx}-${Date.now()}`,
          source: 'loopnet.com',
          source_url: '',
        };

        // Link to detail page
        const link = card.querySelector('a[href*="/Listing/"], a[href*="/listing/"]');
        if (link) listing.source_url = link.href;

        // Address / title
        const titleEl = card.querySelector(
          '.placard-header-title, [class*="ListingTitle"], .listing-title, h2, h3'
        );
        if (titleEl) listing.address = titleEl.textContent.trim();

        // Location
        const locEl = card.querySelector(
          '.placard-header-subtitle, [class*="ListingSubtitle"], .listing-location'
        );
        if (locEl) {
          const parts = locEl.textContent.trim().split(',').map(s => s.trim());
          if (parts.length >= 2) {
            listing.city = parts[0];
            const stateZip = parts[parts.length - 1].trim().split(/\s+/);
            listing.state = stateZip[0];
            if (stateZip[1]) listing.zip = stateZip[1];
          }
        }

        // Price
        const priceEl = card.querySelector(
          '.placard-header-price, [class*="Price"], .listing-price, .price'
        );
        if (priceEl) {
          const priceText = priceEl.textContent.replace(/[^0-9.]/g, '');
          if (priceText) listing.price = parseFloat(priceText);
        }

        // Sqft
        const text = card.textContent;
        const sqftMatch = text.match(/([\d,]+)\s*(?:SF|sq\s*ft|sqft)/i);
        if (sqftMatch) listing.sqft = parseInt(sqftMatch[1].replace(/,/g, ''));

        // Cap rate
        const capMatch = text.match(/([\d.]+)%\s*(?:cap|CAP)/i);
        if (capMatch) listing.cap_rate = parseFloat(capMatch[1]);

        // Property type
        const typeEl = card.querySelector('[class*="PropertyType"], [class*="property-type"]');
        if (typeEl) listing.property_type = typeEl.textContent.trim();
        if (!listing.property_type) listing.property_type = 'Commercial';

        // Only add if we have at least address or price
        if (listing.address || listing.price) {
          listings.push(listing);
        }
      } catch (err) {
        console.error('DealEval: Error scraping LoopNet card:', err);
      }
    });

    return listings;
  }

  // Scrape and send to background
  function scrapeAndSend() {
    const results = scrapeSearchResults();
    if (results.length > 0) {
      chrome.runtime.sendMessage({
        type: 'SEARCH_RESULTS_SCRAPED',
        data: results,
        source: 'loopnet.com',
        pageUrl: window.location.href,
      });
    }
  }

  // Wait for page to fully load, then scrape
  if (document.readyState === 'complete') {
    setTimeout(scrapeAndSend, 2000);
  } else {
    window.addEventListener('load', () => setTimeout(scrapeAndSend, 2000));
  }

  // Also scrape when user scrolls (infinite scroll)
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(scrapeAndSend, 3000);
  });

  // Listen for manual trigger from popup
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'SCRAPE_SEARCH') {
      const results = scrapeSearchResults();
      sendResponse({ results });
    }
  });
})();

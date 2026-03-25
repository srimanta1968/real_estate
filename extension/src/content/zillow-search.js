// Zillow search results page scraper
(function () {
  function scrapeSearchResults() {
    const listings = [];

    const cards = document.querySelectorAll(
      'article[data-test="property-card"], [class*="ListItem"], .property-card-data, li[class*="StyledPropertyCard"]'
    );

    cards.forEach((card, idx) => {
      try {
        const listing = {
          id: `zillow-search-${idx}-${Date.now()}`,
          source: 'zillow.com',
          source_url: '',
        };

        const link = card.querySelector('a[href*="/homedetails/"], a[data-test="property-card-link"]');
        if (link) listing.source_url = link.href.startsWith('http') ? link.href : `https://www.zillow.com${link.href}`;

        const addrEl = card.querySelector('[data-test="property-card-addr"], address, [class*="StyledPropertyCardDataAddress"]');
        if (addrEl) {
          const fullAddr = addrEl.textContent.trim();
          listing.address = fullAddr;
          const parts = fullAddr.split(',').map(s => s.trim());
          if (parts.length >= 3) {
            listing.city = parts[parts.length - 2];
            const stateZip = parts[parts.length - 1].split(/\s+/);
            listing.state = stateZip[0];
            if (stateZip[1]) listing.zip = stateZip[1];
          }
        }

        const priceEl = card.querySelector('[data-test="property-card-price"], [class*="Price"], .list-card-price');
        if (priceEl) {
          const priceText = priceEl.textContent.replace(/[^0-9.]/g, '');
          if (priceText) listing.price = parseFloat(priceText);
        }

        const text = card.textContent;
        const bedsMatch = text.match(/(\d+)\s*(?:bd|bed|bds)/i);
        const bathsMatch = text.match(/(\d+\.?\d*)\s*(?:ba|bath)/i);
        const sqftMatch = text.match(/([\d,]+)\s*(?:sqft|sq\s*ft)/i);

        if (bedsMatch) listing.beds = parseInt(bedsMatch[1]);
        if (bathsMatch) listing.baths = parseFloat(bathsMatch[1]);
        if (sqftMatch) listing.sqft = parseInt(sqftMatch[1].replace(/,/g, ''));

        listing.property_type = 'Residential';

        if (listing.address || listing.price) {
          listings.push(listing);
        }
      } catch (err) {
        console.error('DealEval: Error scraping Zillow card:', err);
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
        source: 'zillow.com',
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

// Zillow search results page scraper
(function () {
  function scrapeSearchResults() {
    const listings = [];
    const seen = new Set();

    // Find all links to listing detail pages
    const allLinks = document.querySelectorAll('a[href*="/homedetails/"]');

    allLinks.forEach((link, idx) => {
      try {
        const href = link.href;
        if (seen.has(href)) return;
        seen.add(href);

        let container = link;
        for (let i = 0; i < 6; i++) {
          if (container.parentElement) container = container.parentElement;
        }

        const text = container.textContent || '';
        const listing = {
          id: `zillow-${idx}-${Date.now()}`,
          source: 'zillow.com',
          source_url: href,
          property_type: 'Residential',
        };

        // Address
        const addrEls = container.querySelectorAll('address, [data-test="property-card-addr"], h2, h3, [class*="address"], [class*="Address"]');
        for (const el of addrEls) {
          const t = el.textContent.trim();
          if (t.length > 5 && t.length < 200 && !t.includes('$')) {
            listing.address = t;
            const parts = t.split(',').map(s => s.trim());
            if (parts.length >= 2) {
              listing.city = parts[parts.length - 2] || '';
              const stateZip = (parts[parts.length - 1] || '').split(/\s+/);
              listing.state = stateZip[0] || '';
              if (stateZip[1]) listing.zip = stateZip[1];
            }
            break;
          }
        }

        // Price — comma-separated format naturally stops at non-comma boundaries
        const priceMatch = text.match(/\$(\d{1,3}(?:,\d{3})*)/);
        if (priceMatch) listing.price = parseFloat(priceMatch[1].replace(/,/g, ''));

        // Beds/baths/sqft
        const bedsMatch = text.match(/(\d+)\s*(?:bd|bed|bds)/i);
        const bathsMatch = text.match(/(\d+\.?\d*)\s*(?:ba|bath)/i);
        const sqftMatch = text.match(/([\d,]+)\s*(?:sqft|sq\s*ft)/i);

        if (bedsMatch) listing.beds = parseInt(bedsMatch[1]);
        if (bathsMatch) listing.baths = parseFloat(bathsMatch[1]);
        if (sqftMatch) listing.sqft = parseInt(sqftMatch[1].replace(/,/g, ''));

        if (listing.address || listing.price) {
          listings.push(listing);
        }
      } catch (err) {
        console.error('DealEval: Zillow scrape error:', err);
      }
    });

    console.log(`DealEval: Scraped ${listings.length} listings from Zillow`);
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
      }).catch(err => console.error('DealEval: Message send error:', err));
    }
  }

  function startScraping() {
    setTimeout(scrapeAndSend, 3000);
    setTimeout(scrapeAndSend, 6000);
    setTimeout(scrapeAndSend, 10000);
  }

  if (document.readyState === 'complete') {
    startScraping();
  } else {
    window.addEventListener('load', startScraping);
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

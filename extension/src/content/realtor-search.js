// Realtor.com search results page scraper
(function () {
  function scrapeSearchResults() {
    const listings = [];
    const seen = new Set();

    const allLinks = document.querySelectorAll('a[href*="/realestateandhomes-detail/"]');

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
          id: `realtor-${idx}-${Date.now()}`,
          source: 'realtor.com',
          source_url: href.startsWith('http') ? href : `https://www.realtor.com${href}`,
          property_type: 'Residential',
        };

        // Address
        const addrEls = container.querySelectorAll('[data-testid*="address"], h2, h3, [class*="address"], [class*="Address"], [class*="card-title"]');
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

        // Price
        const priceMatch = text.match(/\$([\d,]+)/);
        if (priceMatch) listing.price = parseFloat(priceMatch[1].replace(/,/g, ''));

        // Beds/baths/sqft
        const bedsMatch = text.match(/(\d+)\s*(?:bed|bd)/i);
        const bathsMatch = text.match(/(\d+\.?\d*)\s*(?:bath|ba)/i);
        const sqftMatch = text.match(/([\d,]+)\s*(?:sqft|sq\s*ft)/i);

        if (bedsMatch) listing.beds = parseInt(bedsMatch[1]);
        if (bathsMatch) listing.baths = parseFloat(bathsMatch[1]);
        if (sqftMatch) listing.sqft = parseInt(sqftMatch[1].replace(/,/g, ''));

        if (listing.address || listing.price) {
          listings.push(listing);
        }
      } catch (err) {
        console.error('DealEval: Realtor scrape error:', err);
      }
    });

    console.log(`DealEval: Scraped ${listings.length} listings from Realtor.com`);
    return listings;
  }

  function scrapeAndSend() {
    const results = scrapeSearchResults();
    if (results.length > 0) {
      chrome.runtime.sendMessage({
        type: 'SEARCH_RESULTS_SCRAPED',
        data: results,
        source: 'realtor.com',
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

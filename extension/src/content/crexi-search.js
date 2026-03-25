// Crexi search results page scraper
// Robust approach: finds listing links and extracts surrounding data
console.log('DealEval: Crexi search scraper LOADED on', window.location.href);
(function () {
  function scrapeSearchResults() {
    const listings = [];
    const seen = new Set();

    // Strategy 1: Find all links to property detail pages
    const allLinks = document.querySelectorAll('a[href*="/properties/"], a[href*="/property/"]');

    allLinks.forEach((link, idx) => {
      try {
        const href = link.href;
        // Skip if already seen or if it's a filter/nav link
        if (seen.has(href) || href.includes('?') && !href.includes('/properties/')) return;
        seen.add(href);

        // Walk up to find card container
        let container = link;
        for (let i = 0; i < 6; i++) {
          if (container.parentElement) container = container.parentElement;
        }

        const text = container.textContent || '';
        const listing = {
          id: `crexi-${idx}-${Date.now()}`,
          source: 'crexi.com',
          source_url: href.startsWith('http') ? href : `https://www.crexi.com${href}`,
          property_type: 'Commercial',
        };

        // Address from headings
        const headings = container.querySelectorAll('h1, h2, h3, h4, [class*="title"], [class*="Title"], [class*="address"], [class*="Address"]');
        for (const h of headings) {
          const t = h.textContent.trim();
          if (t.length > 5 && t.length < 200 && !t.includes('$') && !t.match(/^\d+%/)) {
            listing.address = t;
            break;
          }
        }
        if (!listing.address) {
          const linkText = link.textContent.trim();
          if (linkText.length > 5 && linkText.length < 200) listing.address = linkText;
        }

        // Price
        const priceMatch = text.match(/\$([\d,]+(?:\.\d+)?)\s*(?:M|K)?/);
        if (priceMatch) {
          let price = parseFloat(priceMatch[1].replace(/,/g, ''));
          if (text.match(/\$[\d,.]+M/)) price *= 1000000;
          if (text.match(/\$[\d,.]+K/)) price *= 1000;
          listing.price = price;
        }

        // Sqft
        const sqftMatch = text.match(/([\d,]+)\s*(?:SF|sq\.?\s*ft|sqft)/i);
        if (sqftMatch) listing.sqft = parseInt(sqftMatch[1].replace(/,/g, ''));

        // Cap rate
        const capMatch = text.match(/([\d.]+)\s*%\s*(?:cap|CAP)/i);
        if (capMatch) listing.cap_rate = parseFloat(capMatch[1]);

        // Location
        const locMatch = text.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)*),\s*([A-Z]{2})(?:\s+(\d{5}))?/);
        if (locMatch) {
          listing.city = locMatch[1];
          listing.state = locMatch[2];
          if (locMatch[3]) listing.zip = locMatch[3];
        }

        if (listing.address || listing.price) {
          listings.push(listing);
        }
      } catch (err) {
        console.error('DealEval: Crexi scrape error:', err);
      }
    });

    // Strategy 2: Fallback - look for card-like containers
    if (listings.length === 0) {
      const cards = document.querySelectorAll('article, [class*="card"], [class*="Card"], [class*="listing"], [class*="Listing"], [class*="result"]');
      cards.forEach((card, idx) => {
        try {
          const text = card.textContent || '';
          const link = card.querySelector('a[href]');
          const href = link?.href || '';

          if (seen.has(href) || (!text.includes('$') && !text.match(/SF|sq ft/i))) return;
          if (href) seen.add(href);

          const listing = {
            id: `crexi-card-${idx}-${Date.now()}`,
            source: 'crexi.com',
            source_url: href,
            property_type: 'Commercial',
          };

          const heading = card.querySelector('h1, h2, h3, h4');
          if (heading) listing.address = heading.textContent.trim();

          const priceMatch = text.match(/\$([\d,]+(?:\.\d+)?)\s*(?:M|K)?/);
          if (priceMatch) {
            let price = parseFloat(priceMatch[1].replace(/,/g, ''));
            if (text.match(/\$[\d,.]+M/)) price *= 1000000;
            if (text.match(/\$[\d,.]+K/)) price *= 1000;
            listing.price = price;
          }

          const sqftMatch = text.match(/([\d,]+)\s*(?:SF|sq\.?\s*ft)/i);
          if (sqftMatch) listing.sqft = parseInt(sqftMatch[1].replace(/,/g, ''));

          const locMatch = text.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)*),\s*([A-Z]{2})(?:\s+(\d{5}))?/);
          if (locMatch) {
            listing.city = locMatch[1];
            listing.state = locMatch[2];
            if (locMatch[3]) listing.zip = locMatch[3];
          }

          if (listing.address || listing.price) {
            listings.push(listing);
          }
        } catch (err) {}
      });
    }

    console.log(`DealEval: Scraped ${listings.length} listings from Crexi`);
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
      }).catch(err => console.error('DealEval: Message send error:', err));
    } else {
      console.log('DealEval: No listings found on Crexi page, will retry...');
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

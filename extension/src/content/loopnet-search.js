// LoopNet search results page scraper
// Uses robust approach: finds all listing links, then extracts data from parent containers
console.log('DealEval: LoopNet search scraper LOADED on', window.location.href);
(function () {
  function scrapeSearchResults() {
    const listings = [];
    const seen = new Set();

    // Strategy 1: Find all links to listing detail pages
    const allLinks = document.querySelectorAll('a[href*="/Listing/"]');

    allLinks.forEach((link, idx) => {
      try {
        const href = link.href;
        if (seen.has(href)) return;
        seen.add(href);

        // Walk up to find the card container (max 6 levels up)
        let container = link;
        for (let i = 0; i < 6; i++) {
          if (container.parentElement) container = container.parentElement;
        }

        const text = container.textContent || '';
        const listing = {
          id: `loopnet-${idx}-${Date.now()}`,
          source: 'loopnet.com',
          source_url: href,
          property_type: 'Commercial',
        };

        // Address: usually the link text itself or a heading nearby
        const headings = container.querySelectorAll('h1, h2, h3, h4, [class*="title"], [class*="Title"], [class*="name"], [class*="Name"]');
        for (const h of headings) {
          const t = h.textContent.trim();
          if (t.length > 5 && t.length < 200 && !t.includes('$') && !t.match(/^\d+%/)) {
            listing.address = t;
            break;
          }
        }
        if (!listing.address) {
          // Try the link text
          const linkText = link.textContent.trim();
          if (linkText.length > 5 && linkText.length < 200) listing.address = linkText;
        }

        // Price: look for dollar amounts
        const priceMatch = text.match(/\$([\d,]+(?:\.\d+)?)\s*(?:M|K)?/);
        if (priceMatch) {
          let price = parseFloat(priceMatch[1].replace(/,/g, ''));
          // Handle $1.5M format
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

        // Location: look for city, state pattern
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
        console.error('DealEval: LoopNet scrape error:', err);
      }
    });

    // Strategy 2: If no links found, try extracting from any card-like elements
    if (listings.length === 0) {
      const cards = document.querySelectorAll('article, [class*="card"], [class*="Card"], [class*="placard"], [class*="result"]');
      cards.forEach((card, idx) => {
        try {
          const text = card.textContent || '';
          const link = card.querySelector('a[href]');
          const href = link?.href || '';

          if (seen.has(href) || (!text.includes('$') && !text.match(/SF|sq ft/i))) return;
          if (href) seen.add(href);

          const listing = {
            id: `loopnet-card-${idx}-${Date.now()}`,
            source: 'loopnet.com',
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

    console.log(`DealEval: Scraped ${listings.length} listings from LoopNet`);
    return listings;
  }

  function scrapeAndSend() {
    const results = scrapeSearchResults();
    if (results.length > 0) {
      chrome.runtime.sendMessage({
        type: 'SEARCH_RESULTS_SCRAPED',
        data: results,
        source: 'loopnet.com',
        pageUrl: window.location.href,
      }).catch(err => console.error('DealEval: Message send error:', err));
    } else {
      console.log('DealEval: No listings found on LoopNet page, will retry...');
    }
  }

  // LoopNet is a SPA - content loads dynamically, need longer delays
  function startScraping() {
    // Try multiple times with increasing delays
    setTimeout(scrapeAndSend, 3000);
    setTimeout(scrapeAndSend, 6000);
    setTimeout(scrapeAndSend, 10000);
  }

  if (document.readyState === 'complete') {
    startScraping();
  } else {
    window.addEventListener('load', startScraping);
  }

  // Re-scrape on scroll (infinite scroll / pagination)
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

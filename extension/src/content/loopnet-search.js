// LoopNet search results page scraper
console.log('DealEval: LoopNet search scraper LOADED on', window.location.href);
(function () {
  let alreadySent = false;

  function scrapeSearchResults() {
    const listings = [];
    const seen = new Set();

    // Find all links to listing detail pages
    const allLinks = document.querySelectorAll('a[href*="/Listing/"]');
    console.log(`DealEval: Found ${allLinks.length} listing links on LoopNet`);

    allLinks.forEach((link) => {
      try {
        const href = link.href;
        if (!href || seen.has(href)) return;
        seen.add(href);

        // Find the closest card-like container — walk up but stop at something reasonable
        let container = link.closest('article, [class*="placard"], [class*="card"], [class*="Card"], li, [role="listitem"]');
        if (!container) {
          // Walk up max 4 levels but stop if element is too large (>5000 chars of text)
          container = link.parentElement;
          for (let i = 0; i < 3; i++) {
            if (container.parentElement && container.parentElement.textContent.length < 3000) {
              container = container.parentElement;
            } else {
              break;
            }
          }
        }

        // Skip if container text is too long (likely a page section, not a card)
        const text = container.textContent || '';
        if (text.length > 3000) return;

        const listing = {
          id: `loopnet-${listings.length}-${Date.now()}`,
          source: 'loopnet.com',
          source_url: href,
          property_type: 'Commercial',
        };

        // Address: first heading-like element in the container
        const headings = container.querySelectorAll('h1, h2, h3, h4, h5, [class*="title" i], [class*="name" i]');
        for (const h of headings) {
          const t = h.textContent.trim();
          // Must look like an address/name, not a page title or category
          if (t.length > 3 && t.length < 150 && !t.includes('$') && !t.match(/commercial real estate/i) && !t.match(/for sale/i)) {
            listing.address = t;
            break;
          }
        }
        // Fallback: use link text if it looks like an address
        if (!listing.address) {
          const linkText = link.textContent.trim();
          if (linkText.length > 3 && linkText.length < 150 && !linkText.match(/view|detail|more/i)) {
            listing.address = linkText;
          }
        }
        if (!listing.address) return; // Skip if no address

        // Price: look for dollar amount within this card only
        const priceMatch = text.match(/\$\s*([\d,]+(?:\.\d+)?)\s*(M|K)?/);
        if (priceMatch) {
          let price = parseFloat(priceMatch[1].replace(/,/g, ''));
          if (priceMatch[2] === 'M') price *= 1000000;
          else if (priceMatch[2] === 'K') price *= 1000;
          // Sanity check: skip prices over $10B
          if (price < 10000000000) listing.price = price;
        }

        // Sqft
        const sqftMatch = text.match(/([\d,]+)\s*(?:SF|sq\.?\s*ft|sqft)/i);
        if (sqftMatch) listing.sqft = parseInt(sqftMatch[1].replace(/,/g, ''));

        // Cap rate
        const capMatch = text.match(/([\d.]+)\s*%\s*(?:cap)/i);
        if (capMatch) listing.cap_rate = parseFloat(capMatch[1]);

        // Location: city, STATE ZIP pattern
        const locMatch = text.match(/([A-Z][a-zA-Z\s]+?),\s*([A-Z]{2})(?:\s+(\d{5}))?/);
        if (locMatch) {
          listing.city = locMatch[1].trim();
          listing.state = locMatch[2];
          if (locMatch[3]) listing.zip = locMatch[3];
        }

        listings.push(listing);
      } catch (err) {
        console.error('DealEval: LoopNet card scrape error:', err);
      }
    });

    console.log(`DealEval: Extracted ${listings.length} unique listings from LoopNet`);
    return listings;
  }

  function scrapeAndSend() {
    const results = scrapeSearchResults();
    if (results.length > 0 && !alreadySent) {
      alreadySent = true;
      chrome.runtime.sendMessage({
        type: 'SEARCH_RESULTS_SCRAPED',
        data: results,
        source: 'loopnet.com',
        pageUrl: window.location.href,
      }).catch(err => console.error('DealEval: Message send error:', err));
    }
  }

  // Retry with increasing delays for SPA loading
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

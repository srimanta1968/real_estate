// LoopNet content script - extracts commercial property data
(function() {
  function extract() {
    const data = { source: 'loopnet.com', source_url: window.location.href };

    try {
      const pageText = document.body.innerText;

      // Address from header
      const addrEl = document.querySelector('.profile-hero-title, h1.listing-title, [class*="ListingTitle"]');
      if (addrEl) data.address = addrEl.textContent.trim();

      // Location
      const locEl = document.querySelector('.profile-hero-subtitle, .listing-location, [class*="ListingSubtitle"]');
      if (locEl) {
        const locParts = locEl.textContent.trim().split(',').map(s => s.trim());
        if (locParts.length >= 2) {
          data.city = locParts[0];
          const stateZip = locParts[locParts.length - 1].split(' ');
          data.state = stateZip[0];
          if (stateZip[1]) data.zip = stateZip[1];
        }
      }

      // Price (handles $2.5M, $500K, and $2,500,000 formats)
      const priceMatch = pageText.match(/(?:price|asking)\s*[:.]?\s*\$?\s*([\d,]+(?:\.\d+)?)\s*(M|K)?/i);
      if (priceMatch) {
        let price = parseFloat(priceMatch[1].replace(/,/g, ''));
        if (priceMatch[2] && priceMatch[2].toUpperCase() === 'M') price *= 1000000;
        else if (priceMatch[2] && priceMatch[2].toUpperCase() === 'K') price *= 1000;
        data.price = price;
      }

      // Cap rate
      const capMatch = pageText.match(/(?:cap\s*rate)\s*[:.]?\s*([\d.]+)%/i);
      if (capMatch) data.raw_data = { ...data.raw_data, listed_cap_rate: parseFloat(capMatch[1]) };

      // NOI
      const noiMatch = pageText.match(/(?:noi|net\s*operating\s*income)\s*[:.]?\s*\$?([\d,]+)/i);
      if (noiMatch) data.raw_data = { ...data.raw_data, listed_noi: parseFloat(noiMatch[1].replace(/,/g, '')) };

      // Sqft
      const sqftMatch = pageText.match(/([\d,]+)\s*(?:sf|sq\s*ft|sqft|square\s*feet)/i);
      if (sqftMatch) data.sqft = parseInt(sqftMatch[1].replace(/,/g, ''));

      // Year built
      const yearMatch = pageText.match(/(?:year\s*built|built)\s*[:.]?\s*(\d{4})/i);
      if (yearMatch) data.year_built = parseInt(yearMatch[1]);

      // Property type
      const typeEl = document.querySelector('.property-type, [class*="PropertyType"]');
      if (typeEl) data.property_type = typeEl.textContent.trim();

      // Units
      const unitsMatch = pageText.match(/(\d+)\s*(?:units?|apartments?)/i);
      if (unitsMatch) data.raw_data = { ...data.raw_data, units: parseInt(unitsMatch[1]) };

      // Lot size
      const lotMatch = pageText.match(/(?:lot\s*size|land\s*area)\s*[:.]?\s*([\d,.]+)\s*(?:acre|sf|sqft)/i);
      if (lotMatch) data.lot_size = parseFloat(lotMatch[1].replace(/,/g, ''));

    } catch (err) {
      console.error('DealEval: LoopNet extraction error:', err);
    }

    return data;
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'EXTRACT') {
      sendResponse(extract());
    }
  });
})();

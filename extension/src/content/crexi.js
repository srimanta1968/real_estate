// Crexi content script - extracts commercial property data
(function() {
  function extract() {
    const data = { source: 'crexi.com', source_url: window.location.href };

    try {
      const pageText = document.body.innerText;

      // Address
      const addrEl = document.querySelector('h1[class*="address"], h1[class*="title"], .property-header h1');
      if (addrEl) data.address = addrEl.textContent.trim();

      // Location
      const locEl = document.querySelector('[class*="location"], [class*="subtitle"]');
      if (locEl) {
        const locText = locEl.textContent.trim();
        const parts = locText.split(',').map(s => s.trim());
        if (parts.length >= 2) {
          data.city = parts[0];
          const stateZip = parts[parts.length - 1].split(' ');
          data.state = stateZip[0];
          if (stateZip[1]) data.zip = stateZip[1];
        }
      }

      // Price (handles $2.5M, $500K, and $2,500,000 formats)
      const priceMatch = pageText.match(/(?:price|asking|list\s*price)\s*[:.]?\s*\$?\s*([\d,]+(?:\.\d+)?)\s*(M|K)?/i);
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
      const noiMatch = pageText.match(/(?:noi)\s*[:.]?\s*\$?([\d,]+)/i);
      if (noiMatch) data.raw_data = { ...data.raw_data, listed_noi: parseFloat(noiMatch[1].replace(/,/g, '')) };

      // Sqft
      const sqftMatch = pageText.match(/([\d,]+)\s*(?:sf|sq\s*ft|sqft)/i);
      if (sqftMatch) data.sqft = parseInt(sqftMatch[1].replace(/,/g, ''));

      // Year built
      const yearMatch = pageText.match(/(?:year\s*built|built)\s*[:.]?\s*(\d{4})/i);
      if (yearMatch) data.year_built = parseInt(yearMatch[1]);

      // Property type
      const typeMatch = pageText.match(/(?:property\s*type|asset\s*type)\s*[:.]?\s*([A-Za-z\s]+?)(?:\n|,|\|)/i);
      if (typeMatch) data.property_type = typeMatch[1].trim();

      // Units
      const unitsMatch = pageText.match(/(\d+)\s*(?:units?)/i);
      if (unitsMatch) data.raw_data = { ...data.raw_data, units: parseInt(unitsMatch[1]) };

      // Lot size
      const lotMatch = pageText.match(/(?:lot|land)\s*[:.]?\s*([\d,.]+)\s*(?:acres?|sf)/i);
      if (lotMatch) data.lot_size = parseFloat(lotMatch[1].replace(/,/g, ''));

    } catch (err) {
      console.error('DealEval: Crexi extraction error:', err);
    }

    return data;
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'EXTRACT') {
      sendResponse(extract());
    }
  });
})();

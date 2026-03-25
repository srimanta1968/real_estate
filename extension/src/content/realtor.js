// Realtor.com content script - extracts property data from listing pages
(function() {
  function extract() {
    const data = { source: 'realtor.com', source_url: window.location.href };

    try {
      // JSON-LD structured data
      const jsonLd = document.querySelector('script[type="application/ld+json"]');
      if (jsonLd) {
        const parsed = JSON.parse(jsonLd.textContent);
        const item = Array.isArray(parsed) ? parsed.find(p => p['@type'] === 'SingleFamilyResidence' || p['@type'] === 'Residence') : parsed;
        if (item) {
          data.address = item.address?.streetAddress || '';
          data.city = item.address?.addressLocality || '';
          data.state = item.address?.addressRegion || '';
          data.zip = item.address?.postalCode || '';
          if (item.floorSize?.value) data.sqft = parseInt(item.floorSize.value);
          if (item.numberOfRooms) data.beds = parseInt(item.numberOfRooms);
        }
      }

      // Price
      const priceEl = document.querySelector('[data-testid="list-price"], .price-section .price, .ldp-header-price');
      if (priceEl) data.price = parseFloat(priceEl.textContent.replace(/[^0-9.]/g, ''));

      // Address fallback
      if (!data.address) {
        const addrEl = document.querySelector('[data-testid="address-line"], .address-section');
        if (addrEl) data.address = addrEl.textContent.trim();
      }

      // Details
      const details = document.querySelectorAll('[data-testid="bed-bath-sqft"] li, .property-meta li');
      details.forEach(el => {
        const text = el.textContent.toLowerCase();
        if (text.includes('bed')) data.beds = parseInt(text);
        if (text.includes('bath')) data.baths = parseFloat(text);
        if (text.includes('sqft') || text.includes('sq ft')) data.sqft = parseInt(text.replace(/[^0-9]/g, ''));
      });

      // Property details section
      const pageText = document.body.innerText;
      const yearMatch = pageText.match(/(?:year\s*built|built\s*in)\s*[:.]?\s*(\d{4})/i);
      const lotMatch = pageText.match(/(?:lot\s*size)\s*[:.]?\s*([\d,.]+)\s*(?:sq|acre)/i);
      const taxMatch = pageText.match(/(?:tax|property\s*tax)\s*[:.]?\s*\$?([\d,]+)/i);

      if (yearMatch) data.year_built = parseInt(yearMatch[1]);
      if (lotMatch) data.lot_size = parseFloat(lotMatch[1].replace(/,/g, ''));
      if (taxMatch) data.tax_amount = parseFloat(taxMatch[1].replace(/,/g, ''));

      // Property type
      const typeEl = document.querySelector('[data-testid="property-type"]');
      if (typeEl) data.property_type = typeEl.textContent.trim();

    } catch (err) {
      console.error('DealEval: Realtor.com extraction error:', err);
    }

    return data;
  }

  // Listen for extraction request from popup
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'EXTRACT') {
      sendResponse(extract());
    }
  });
})();

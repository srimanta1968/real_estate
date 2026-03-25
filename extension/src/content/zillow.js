// Zillow content script - extracts property data from listing pages
(function() {
  function extract() {
    const data = { source: 'zillow.com', source_url: window.location.href };

    try {
      // Zillow embeds data in __NEXT_DATA__ or window.__data
      const nextData = document.getElementById('__NEXT_DATA__');
      if (nextData) {
        try {
          const parsed = JSON.parse(nextData.textContent);
          const property = parsed?.props?.pageProps?.property || parsed?.props?.pageProps?.componentProps?.gdpClientCache;
          if (property) {
            data.address = property.streetAddress || property.address?.streetAddress || '';
            data.city = property.city || property.address?.city || '';
            data.state = property.state || property.address?.state || '';
            data.zip = property.zipcode || property.address?.zipcode || '';
            data.price = property.price || property.listPrice || 0;
            data.beds = property.bedrooms || property.beds || null;
            data.baths = property.bathrooms || property.baths || null;
            data.sqft = property.livingArea || property.sqft || null;
            data.lot_size = property.lotSize || property.lotAreaValue || null;
            data.year_built = property.yearBuilt || null;
            data.property_type = property.homeType || property.propertyType || null;
            data.tax_amount = property.taxAssessedValue || property.propertyTaxRate || null;
          }
        } catch {}
      }

      // Fallback: DOM parsing
      if (!data.address) {
        const addrEl = document.querySelector('[data-testid="bdp-header-address"], h1.Text-c11n-8-99-3__sc-aiai24-0');
        if (addrEl) data.address = addrEl.textContent.trim();
      }

      if (!data.price) {
        const priceEl = document.querySelector('[data-testid="price"], .summary-container .ds-value, span[data-testid="price"]');
        if (priceEl) data.price = parseFloat(priceEl.textContent.replace(/[^0-9.]/g, ''));
      }

      // Bed/bath/sqft from summary
      const summaryItems = document.querySelectorAll('[data-testid="bed-bath-beyond"] span, .ds-bed-bath-living-area span');
      summaryItems.forEach(el => {
        const text = el.textContent.toLowerCase();
        if (text.includes('bd') || text.includes('bed')) data.beds = data.beds || parseInt(text);
        if (text.includes('ba') || text.includes('bath')) data.baths = data.baths || parseFloat(text);
        if (text.includes('sqft') || text.includes('sq')) data.sqft = data.sqft || parseInt(text.replace(/[^0-9]/g, ''));
      });

    } catch (err) {
      console.error('DealEval: Zillow extraction error:', err);
    }

    return data;
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'EXTRACT') {
      sendResponse(extract());
    }
  });
})();

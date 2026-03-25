// Generic fallback extractor - uses JSON-LD, Open Graph, and schema.org markup
(function() {
  function extract() {
    const data = { source: window.location.hostname, source_url: window.location.href };

    try {
      // 1. JSON-LD structured data
      const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of jsonLdScripts) {
        try {
          let parsed = JSON.parse(script.textContent);
          if (Array.isArray(parsed)) parsed = parsed[0];

          if (parsed['@type']?.match(/Residence|RealEstate|Product|Place|SingleFamily|House|Apartment/i)) {
            data.address = parsed.address?.streetAddress || parsed.name || data.address;
            data.city = parsed.address?.addressLocality || data.city;
            data.state = parsed.address?.addressRegion || data.state;
            data.zip = parsed.address?.postalCode || data.zip;
            if (parsed.offers?.price) data.price = parseFloat(parsed.offers.price);
            if (parsed.floorSize?.value) data.sqft = parseInt(parsed.floorSize.value);
            if (parsed.numberOfRooms) data.beds = parseInt(parsed.numberOfRooms);
            if (parsed.numberOfBathroomsTotal) data.baths = parseFloat(parsed.numberOfBathroomsTotal);
          }
        } catch {}
      }

      // 2. Open Graph meta tags
      if (!data.address) {
        data.address = document.querySelector('meta[property="og:title"]')?.content || '';
      }
      if (!data.price) {
        const ogPrice = document.querySelector('meta[property="product:price:amount"], meta[property="og:price:amount"]')?.content;
        if (ogPrice) data.price = parseFloat(ogPrice);
      }

      // 3. Schema.org microdata
      const itemprops = {
        streetAddress: 'address',
        addressLocality: 'city',
        addressRegion: 'state',
        postalCode: 'zip',
        price: 'price',
      };
      for (const [prop, field] of Object.entries(itemprops)) {
        if (!data[field]) {
          const el = document.querySelector(`[itemprop="${prop}"]`);
          if (el) {
            const val = el.content || el.textContent?.trim();
            if (val) data[field] = field === 'price' ? parseFloat(val.replace(/[^0-9.]/g, '')) : val;
          }
        }
      }

      // 4. Page text pattern matching
      const pageText = document.body.innerText;
      if (!data.beds) { const m = pageText.match(/(\d+)\s*(?:bed|br|bedroom)/i); if (m) data.beds = parseInt(m[1]); }
      if (!data.baths) { const m = pageText.match(/(\d+\.?\d*)\s*(?:bath|ba)/i); if (m) data.baths = parseFloat(m[1]); }
      if (!data.sqft) { const m = pageText.match(/([\d,]+)\s*(?:sq\s*ft|sqft|square\s*feet)/i); if (m) data.sqft = parseInt(m[1].replace(/,/g, '')); }
      if (!data.year_built) { const m = pageText.match(/(?:built|year\s*built)\s*(?:in\s*)?(\d{4})/i); if (m) data.year_built = parseInt(m[1]); }

    } catch (err) {
      console.error('DealEval: Fallback extraction error:', err);
    }

    return data;
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'EXTRACT') {
      sendResponse(extract());
    }
  });
})();
